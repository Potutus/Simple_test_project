import {
	BadRequestException,
	ForbiddenException,
	Injectable,
	InternalServerErrorException,
	NotFoundException,
	UnauthorizedException,
} from '@nestjs/common'
import { InjectModel } from '@nestjs/sequelize'
import { ms } from 'src/libs/common/utils/ms.utils'
import { MailService } from 'src/libs/mail/mail.service'
import { Token } from 'src/users/entities/token.model'
import { UsersService } from 'src/users/users.service'
import { HMAC_TYPE, TOKEN_TYPE } from 'src/utils/const.config'
import { NewEmailDto, OldEmailConfirmationDto } from './dto/email-change.dto'
import { ConfigService } from '@nestjs/config'
import crypto from 'crypto'
import { TokenCipher } from 'src/libs/token-generator/hmac-token-cipher.service'
import { TokenPayload } from 'src/utils/types/token-generator.type'

@Injectable()
export class EmailChangeService {
	public constructor(
		@InjectModel(Token)
		private readonly tokenModel: typeof Token,
		private readonly usersService: UsersService,
		private readonly mailService: MailService,
		private readonly configService: ConfigService
	) {}

	private async getEmailEncryptTokenData() {
		const hmacType = HMAC_TYPE.EMAIL_CHANGE.TYPE
		const cipherAlgo = HMAC_TYPE.EMAIL_CHANGE.CIPHER
		const signatureSecretCoded = await this.configService.getOrThrow<string>(
			'TOKEN_HMAC_SIGNATURE_64_SECRET'
		)
		const encCipherSecretCoded = await this.configService.getOrThrow<string>(
			'TOKEN_HMAC_CIPHER_ENC_32_SECRET'
		)

		const signatureSecret = Buffer.from(signatureSecretCoded, 'base64')
		const encCipherSecret = Buffer.from(encCipherSecretCoded, 'base64')

		return {
			hmacType,
			cipherAlgo,
			signatureSecret,
			encCipherSecret,
		}
	}

	public async sendConfirmNewEmail(
		userID: string,
		newEmailDto: NewEmailDto
	): Promise<{ message: string }> {
		const user = await this.usersService.findOne({
			where: {
				id: userID,
			},
		})

		if (!user) {
			throw new UnauthorizedException('Пользователь не найден')
		}

		const existingUser = await this.usersService.findOne({
			where: {
				email: newEmailDto.email,
			},
		})

		if (existingUser) {
			throw new BadRequestException(
				'Данный email уже используется. Пожалуйста, укажите иной адрес электронной почты и попробуйте снова.'
			)
		}

		await this.sendConfirmNewEmailToken(user.email, newEmailDto.email, user.id)

		await this.sendOldEmailCodeToken(user.email)

		return {
			message:
				'Ссылка на подтверждение новой почты выслана. Так-же был выслан код подтверждение на существующую почту.',
		}
	}

	public async verifyEmailChange(
		userID: string,
		token: string,
		oldEmailConfirmationDto: OldEmailConfirmationDto
	): Promise<boolean> {
		const { newEmailToken, payload } = await this.verifyNewEmailToken(token)

		if (payload.userID != userID) {
			throw new ForbiddenException('Отказано в доступе.')
		}

		const existingUser = await this.usersService.findOne({
			where: {
				id: payload.userID,
				email: newEmailToken.email,
			},
		})

		if (!existingUser) {
			throw new NotFoundException(
				'Пользователь не найден. Пожалуйста, проверьте введенный адрес электронной почты и попробуйте снова.'
			)
		}

		const oldEmailConfirmToken = await this.verifyOldEmailToken(
			oldEmailConfirmationDto.code
		)

		await existingUser
			.update({
				email: payload.email,
				isVerified: true,
			})
			.catch((e) => {
				throw new InternalServerErrorException(
					'При обновлении почты что-то пошло не так. Попробуйте снова позже.'
				)
			})

		await newEmailToken.destroy()
		await oldEmailConfirmToken.destroy()

		return true
	}

	private async verifyNewEmailToken(
		token: string
	): Promise<{ newEmailToken: Token; payload: any }> {
		const newEmailToken = await this.tokenModel.findOne({
			where: {
				token: token,
				type: TOKEN_TYPE.VERIFICATION,
			},
		})

		if (!newEmailToken) {
			throw new NotFoundException(
				'Токен не найден. Пожалуйста, проверьте правильность введенного токена или запросите новый.'
			)
		}

		const newEmailTokenHasExpired =
			new Date(newEmailToken.expiresAt) < new Date()

		if (newEmailTokenHasExpired) {
			await newEmailToken.destroy()

			throw new BadRequestException(
				'Токен истек. Пожалуйста, запросите новый токен для подтверждения смены почты.'
			)
		}

		const { hmacType, cipherAlgo, signatureSecret, encCipherSecret } =
			await this.getEmailEncryptTokenData()

		const cipher = new TokenCipher(
			encCipherSecret,
			signatureSecret,
			hmacType,
			cipherAlgo
		)

		const payload: Record<string, any> = cipher.decrypt(token)

		return {
			newEmailToken,
			payload,
		}
	}

	private async verifyOldEmailToken(code: string): Promise<Token> {
		const oldEmailConfirmToken = await this.tokenModel.findOne({
			where: {
				token: code,
				type: TOKEN_TYPE.CHANGE_EMAIL,
			},
		})

		if (!oldEmailConfirmToken) {
			throw new NotFoundException(
				'Токен не найден. Пожалуйста, проверьте правильность введенного токена или запросите новый.'
			)
		}

		const oldEmailConfirmTokenHasExpired =
			new Date(oldEmailConfirmToken.expiresAt) < new Date()

		if (oldEmailConfirmTokenHasExpired) {
			await oldEmailConfirmToken.destroy()

			throw new BadRequestException(
				'Код истек. Пожалуйста, запросите новый токен для подтверждения смены почты.'
			)
		}

		return oldEmailConfirmToken
	}

	private async sendConfirmNewEmailToken(
		oldEmail: string,
		newEmail: string,
		userID: string
	): Promise<boolean> {
		const newEmailToken = await this.generateNewEmailToken(
			oldEmail,
			newEmail,
			userID
		)

		await this.mailService
			.sendChangeEmailTokenEmail(newEmailToken.email, newEmailToken.token)
			.catch((e) => {
				throw new InternalServerErrorException(
					'При отправке сообщения возникла ошибка, попробуйте снова.'
				)
			})

		return true
	}

	private async generateNewEmailToken(
		oldEmail: string,
		newEmail: string,
		userID: string
	): Promise<Token> {
		const { hmacType, cipherAlgo, signatureSecret, encCipherSecret } =
			await this.getEmailEncryptTokenData()

		const cipher = new TokenCipher(
			encCipherSecret,
			signatureSecret,
			hmacType,
			cipherAlgo
		)

		const payload = {
			userID: userID,
			email: newEmail,
		}

		const token = cipher.encrypt(payload)
		const expiresIn = new Date(new Date().getTime() + ms('15M'))

		const existingToken = await this.tokenModel.findOne({
			where: {
				email: oldEmail,
				type: TOKEN_TYPE.VERIFICATION,
			},
		})

		if (existingToken) {
			await existingToken.destroy()
		}

		const emailResetToken = await this.tokenModel
			.create({
				email: oldEmail,
				token: token,
				expiresAt: expiresIn,
				type: TOKEN_TYPE.VERIFICATION,
			})
			.catch((e) => {
				throw new InternalServerErrorException(
					'При создании токена возникла ошибка, попробуйте снова.'
				)
			})

		return emailResetToken
	}

	private async sendOldEmailCodeToken(email: string): Promise<boolean> {
		const twoFactorToken = await this.generateOldEmailConfirmationToken(email)

		await this.mailService
			.sendOldEmailConfirmationTokenEmail(
				twoFactorToken.email,
				twoFactorToken.token
			)
			.catch((e) => {
				throw new InternalServerErrorException(
					'При отправке сообщения возникла ошибка, попробуйте снова.'
				)
			})

		return true
	}

	private async generateOldEmailConfirmationToken(
		email: string
	): Promise<Token> {
		const token = Math.floor(
			Math.random() * (1000000 - 100000) + 100000
		).toString()
		const expiresIn = new Date(new Date().getTime() + ms('15M'))

		const existingToken = await this.tokenModel.findOne({
			where: {
				email: email,
				type: TOKEN_TYPE.CHANGE_EMAIL,
			},
		})

		if (existingToken) {
			await existingToken.destroy()
		}

		const oldEmailConfimToken = await this.tokenModel
			.create({
				email: email,
				token: token,
				expiresAt: expiresIn,
				type: TOKEN_TYPE.CHANGE_EMAIL,
			})
			.catch((e) => {
				throw new InternalServerErrorException(
					'При создании токена возникла ошибка, попробуйте снова.'
				)
			})

		return oldEmailConfimToken
	}
}
