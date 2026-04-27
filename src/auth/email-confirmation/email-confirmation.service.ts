import {
	BadRequestException,
	Injectable,
	Inject,
	InternalServerErrorException,
	NotFoundException,
	forwardRef,
} from '@nestjs/common'
import { InjectModel } from '@nestjs/sequelize'
import { MailService } from 'src/libs/mail/mail.service'
import { Token } from 'src/users/entities/token.model'
import { User } from 'src/users/entities/users.model'
import { UsersService } from 'src/users/users.service'
import { AuthService } from '../auth.service'
import { v4 as uuidv4 } from 'uuid'
import { TOKEN_TYPE } from 'src/utils/const.config'
import { ms } from 'src/libs/common/utils/ms.utils'
import { ConfirmationDto } from './dto/confirmation.dto'
import { Request } from 'express'
import { InternalBusinessException } from 'src/exception/internal-business.exception'

@Injectable()
export class EmailConfirmationService {
	public constructor(
		@InjectModel(User)
		private readonly userModel: typeof User,
		@InjectModel(Token)
		private readonly tokenModel: typeof Token,
		private readonly usersService: UsersService,
		private readonly mailService: MailService,
		@Inject(forwardRef(() => AuthService))
		private readonly authService: AuthService
	) {}

	public async newVerification(
		req: Request,
		confirmationDto: ConfirmationDto
	): Promise<{ message: string }> {
		const transaction = await this.userModel.sequelize.transaction()

		try {
			const existingToken = await this.tokenModel.findOne({
				where: {
					token: confirmationDto.token,
					type: TOKEN_TYPE.VERIFICATION,
				},
			})

			if (!existingToken) {
				throw new NotFoundException(
					'Токен подтверждения не найден. Пожалуйста, убедитесь, что у вас правильный токен.'
				)
			}

			const hasExpired = new Date(existingToken.expiresAt) < new Date()

			if (hasExpired) {
				await existingToken.destroy()

				throw new BadRequestException(
					'Токен подтверждения истек. Пожалуйста, запросите новый токен для подтверждения.'
				)
			}

			const existingUser = await this.usersService.findOne({
				where: {
					email: existingToken.email,
				},
			})

			if (!existingUser) {
				throw new NotFoundException(
					'Пользователь не найден. Пожалуйста, проверьте введенный адрес электронной почты и попробуйте снова.'
				)
			}

			await existingUser
				.update(
					{
						isVerified: true,
					},
					{
						transaction: transaction,
					}
				)
				.catch((e) => {
					throw new BadRequestException(
						'Неверные входящие данные при подтверждении подлинности аккаунта'
					)
				})

			await existingToken
				.destroy({
					transaction: transaction,
				})
				.catch((e) => {
					throw new BadRequestException(
						'Неверные входящие данные при обновлении токена'
					)
				})

			transaction.commit()

			await this.authService.saveSession(req, existingUser)

			return {
				message: 'Пользователь успешно подтвержден!',
			}
		} catch (e) {
			transaction.rollback()

			if (e instanceof BadRequestException || e instanceof NotFoundException) {
				throw e
			}

			throw new InternalBusinessException(
				'При подтверждении токена что-то пошло не так'
			)
		}
	}

	private async generateVerificationToken(email: string): Promise<Token> {
		const token = uuidv4()
		const expiresIn = new Date(new Date().getTime() + ms('1H'))

		const existingToken = await this.tokenModel.findOne({
			where: {
				email: email,
				type: TOKEN_TYPE.VERIFICATION,
			},
		})

		if (existingToken) {
			await existingToken.destroy().catch((e) => {
				throw new BadRequestException(
					'Неверные входящие данные при обновлении токена'
				)
			})
		}

		const verificationToken = await this.tokenModel
			.create({
				email: email,
				token: token,
				expiresAt: expiresIn,
				type: TOKEN_TYPE.VERIFICATION,
			})
			.catch((e) => {
				throw new BadRequestException(
					'Неверные входящие данные при генерации токена'
				)
			})

		return verificationToken
	}

	public async sendVerificationToken(email: string): Promise<boolean> {
		const verificationToken = await this.generateVerificationToken(email)

		try {
			await this.mailService.sendConfirmationEmail(
				verificationToken.email,
				verificationToken.token
			)

			return true
		} catch (e) {
			throw new InternalBusinessException(
				'При отправке сообщения что-то пошло не так'
			)
		}
	}
}
