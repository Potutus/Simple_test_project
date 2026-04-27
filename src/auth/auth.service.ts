import {
	BadRequestException,
	Injectable,
	InternalServerErrorException,
	NotFoundException,
	UnauthorizedException,
} from '@nestjs/common'
import { Role } from 'src/roles/entities/roles.model'
import { UsersService } from 'src/users/users.service'
import { ArgonService } from './argon2/argon.service'
import { Profile } from 'src/profile/entities/profile.model'
import { LoginUserDto, RegisterUserDto } from './dto/user.dto'
import passport from 'passport'
import { AuthMethod, User } from 'src/users/entities/users.model'
import { Request, Response } from 'express'
import { ConfigService } from '@nestjs/config'
import { OauthProviderService } from './oauth-provider/oauth-provider.service'
import { Account } from 'src/users/entities/accounts.model'
import { InjectModel } from '@nestjs/sequelize'
import { EmailConfirmationService } from './email-confirmation/email-confirmation.service'
import { TwoFactorAuthService } from './two-factor-auth/two-factor-auth.service'
import { InternalBusinessException } from 'src/exception/internal-business.exception'

@Injectable()
export class AuthService {
	constructor(
		@InjectModel(Account)
		private readonly accountModel: typeof Account,
		private readonly usersService: UsersService,
		private readonly argonService: ArgonService,
		private readonly configService: ConfigService,
		private readonly oauthProviderServiec: OauthProviderService,
		private readonly emailConfirmationService: EmailConfirmationService,
		private readonly twoFactorAuthService: TwoFactorAuthService
	) {}

	async register(registerUserDto: RegisterUserDto) {
		const transaction = await this.accountModel.sequelize.transaction()
		try {
			const newUser = await this.usersService.createUser(
				registerUserDto?.email,
				registerUserDto?.username,
				registerUserDto?.password,
				AuthMethod.CREDENTIALS,
				false,
				'',
				transaction
			)

			await this.emailConfirmationService.sendVerificationToken(newUser.email)

			await transaction.commit()

			return {
				user: {
					username: newUser?.username,
				},
				message:
					'Вы зарегистрировались! Пожалуйста, подтвердите ваш email. Сообщение было отправлено на ваш почтовый адрес.',
			}
		} catch (e) {
			await transaction.rollback()

			const constraint = e?.parent?.constraint

			if (constraint === 'users_username_key') {
				throw new BadRequestException(
					'Пользователь с таким именем уже существует'
				)
			}

			if (constraint === 'users_email_key') {
				throw new BadRequestException(
					'Пользователь с таким email уже существует'
				)
			}

			if (
				e instanceof BadRequestException ||
				e instanceof NotFoundException ||
				e instanceof InternalBusinessException
			) {
				throw e
			}

			throw new InternalBusinessException('Что-то пошло не так')
		}
	}

	async login(req: Request, loginUserDto: LoginUserDto) {
		const user = await this.usersService
			.findOne({
				where: { username: loginUserDto?.username },
				include: [
					{
						attributes: ['id', 'value', 'description'],
						model: Role,
						through: { attributes: [] },
					},
					{
						attributes: ['id'],
						model: Profile,
					},
				],
			})
			.catch((e) => {
				throw new InternalServerErrorException('Что-то пошло не так')
			})

		if (!user || !user?.password) {
			throw new BadRequestException('Неверное имя пользователя или пароль')
		}

		const isValidPassword = await this.argonService.compare(
			user?.password,
			loginUserDto?.password
		)

		if (!isValidPassword) {
			throw new BadRequestException('Неверное имя пользователя или пароль')
		}

		if (!user.isVerified) {
			await this.emailConfirmationService.sendVerificationToken(user.email)

			throw new UnauthorizedException(
				'Ваш email не подтвержден. Пожалуйста проверьте вашу почту и подтвердите адрес.'
			)
		}

		if (user.isTwoFactorEnabled) {
			if (!loginUserDto.code) {
				await this.twoFactorAuthService.sendTwoFactorToken(user.email)

				return {
					message:
						'Проверьте вашу почту. Требуется код двухфакторной аутентификации.',
				}
			}

			await this.twoFactorAuthService.validateTwoFactorToken(
				user.email,
				loginUserDto.code
			)
		}

		if (user && isValidPassword) {
			await this.saveSession(req, user)

			return {
				message: 'Вход выполнен успешно!',
			}
		}

		throw new InternalServerErrorException('При входе произошла ошибка')
	}

	async extractProfileFromCode(req: Request, provider: string, code: string) {
		const transaction = await this.accountModel.sequelize.transaction()
		try {
			const oauthProviderInstance =
				this.oauthProviderServiec.findByService(provider)

			const profile = await oauthProviderInstance.findUserByCode(code)

			const account = await this.accountModel.findOne({
				where: {
					id: profile.id ?? null,
					provider: profile.provider,
				},
			})

			let user = account?.userID
				? await this.usersService.findOne({ where: { id: account.userID } })
				: null

			if (user) {
				return this.saveSession(req, user)
			}

			user = await this.usersService.createUser(
				profile.email,
				profile.name,
				'',
				AuthMethod[profile.provider.toUpperCase()],
				true,
				profile.picture,
				transaction
			)

			if (!account) {
				await user.$create(
					'account',
					{
						type: 'oauth',
						provider: profile.provider,
						accessToken: profile.access_token,
						refreshToken: profile.refresh_token,
						expiresAt: profile.expires_at,
					},
					{ transaction: transaction }
				)
			}

			await transaction.commit()

			return this.saveSession(req, user)
		} catch (e) {
			await transaction.rollback()

			if (e instanceof (BadRequestException || UnauthorizedException)) {
				throw e
			}

			throw new InternalServerErrorException('Что-то пошло не так')
		}
	}

	async logout(req: Request, res: Response): Promise<{ message: string }> {
		const sessionName = this.configService.getOrThrow<string>('SESSION_NAME')

		return new Promise((resolve, reject) => {
			req.session.destroy((e) => {
				if (e) {
					return reject(
						new InternalServerErrorException(
							'Не удалось завершить сессию, возможно возникла проблема с сервером или сессия уже была завершена'
						)
					)
				}

				res.clearCookie(sessionName)

				resolve({
					message: 'Выход выполнен успешно!',
				})
			})
		})
	}

	async saveSession(req: Request, user: User) {
		return new Promise((resolve, reject) => {
			req.session.userId = user.id
			//req.session.username = user.username
			//req.session.email = user.email
			//req.session.profileId = user.profile.id
			//req.session.roles = user.roles

			req.session.save((e) => {
				if (e) {
					return reject(
						new InternalServerErrorException('Не удалось сохранить сессию')
					)
				}

				resolve({
					user,
				})
			})
		})
	}
}
