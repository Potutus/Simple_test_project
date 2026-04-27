import {
	BadRequestException,
	Injectable,
	InternalServerErrorException,
	NotFoundException,
} from '@nestjs/common'
import { InjectModel } from '@nestjs/sequelize'
import { ms } from 'src/libs/common/utils/ms.utils'
import { MailService } from 'src/libs/mail/mail.service'
import { Token } from 'src/users/entities/token.model'
import { UsersService } from 'src/users/users.service'
import { TOKEN_TYPE } from 'src/utils/const.config'
import { v4 as uuidv4 } from 'uuid'
import { NewPasswordDto } from './dto/new-password.dto'
import { ResetPasswordDto } from './dto/reset-password.dto'
import { ArgonService } from '../argon2/argon.service'

@Injectable()
export class PasswordRecoveryService {
	public constructor(
		@InjectModel(Token)
		private readonly tokenModel: typeof Token,
		private readonly argonService: ArgonService,
		private readonly usersService: UsersService,
		private readonly mailService: MailService
	) {}

	public async reset(resetPasswordDto: ResetPasswordDto): Promise<boolean> {
		const existingUser = await this.usersService.findOne({
			where: {
				email: resetPasswordDto.email,
			},
		})

		if (!existingUser) {
			throw new NotFoundException(
				'Пользователь не найден. Пожалуйста, проверьте введенный адрес электронной почты и попробуйте снова.'
			)
		}

		await this.sendPasswordResetToken(existingUser.email)

		return true
	}

	public async new(
		newPasswordDto: NewPasswordDto,
		token: string
	): Promise<boolean> {
		const existingToken = await this.tokenModel.findOne({
			where: {
				token: token,
				type: TOKEN_TYPE.PASSWORD_RESET,
			},
		})

		if (!existingToken) {
			throw new NotFoundException(
				'Токен не найден. Пожалуйста, проверьте правильность введенного токена или запросите новый.'
			)
		}

		const hasExpired = new Date(existingToken.expiresAt) < new Date()

		if (hasExpired) {
			await existingToken.destroy()

			throw new BadRequestException(
				'Токен истек. Пожалуйста, запросите новый токен для подтверждения сброса пароля.'
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
			.update({
				password: await this.argonService.hash(newPasswordDto.password),
			})
			.catch((e) => {
				throw new InternalServerErrorException(
					'При обновлении пароля что-то пошло не так. Попробуйте снова позже'
				)
			})

		await existingToken.destroy()

		return true
	}

	private async sendPasswordResetToken(email: string): Promise<boolean> {
		const passwordResetToken = await this.generatePasswordResetToken(email)

		await this.mailService
			.sendPasswordResetEmail(
				passwordResetToken.email,
				passwordResetToken.token
			)
			.catch((e) => {
				throw new InternalServerErrorException(
					'При отправке сообщения возникла ошибка, попробуйте снова.'
				)
			})

		return true
	}

	private async generatePasswordResetToken(email: string): Promise<Token> {
		const token = uuidv4()
		const expiresIn = new Date(new Date().getTime() + ms('1H'))

		const existingToken = await this.tokenModel.findOne({
			where: {
				email: email,
				type: TOKEN_TYPE.PASSWORD_RESET,
			},
		})

		if (existingToken) {
			await existingToken.destroy()
		}

		const passwordResetToken = await this.tokenModel.create({
			email: email,
			token: token,
			expiresAt: expiresIn,
			type: TOKEN_TYPE.PASSWORD_RESET,
		})

		return passwordResetToken
	}
}
