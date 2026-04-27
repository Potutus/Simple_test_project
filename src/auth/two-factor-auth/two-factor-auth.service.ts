import {
	BadRequestException,
	Injectable,
	NotFoundException,
} from '@nestjs/common'
import { InjectModel } from '@nestjs/sequelize'
import { ms } from 'src/libs/common/utils/ms.utils'
import { MailService } from 'src/libs/mail/mail.service'
import { Token } from 'src/users/entities/token.model'
import { TOKEN_TYPE } from 'src/utils/const.config'

@Injectable()
export class TwoFactorAuthService {
	constructor(
		@InjectModel(Token)
		private readonly tokenModel: typeof Token,
		private readonly mailService: MailService
	) {}

	async validateTwoFactorToken(email: string, code: string): Promise<boolean> {
		const existingToken = await this.tokenModel.findOne({
			where: {
				email: email,
				type: TOKEN_TYPE.TWO_FACTOR,
			},
		})

		if (!existingToken) {
			throw new NotFoundException(
				'Токен двухфакторной аутентификации не найден. Убедитесь, что вы запрашивали токен для данного адреса электронной почты.'
			)
		}

		if (existingToken.token !== code) {
			throw new BadRequestException(
				'Неверный код двухфакторной аутентификации. Пожалуйста, проверьте введенный код и попробуйте снова.'
			)
		}

		const hasExpired = new Date(existingToken.expiresAt) < new Date()

		if (hasExpired) {
			await existingToken.destroy()

			throw new BadRequestException(
				'Срок действия токена двухфакторной аутентификации истек. Пожалуйста, запросите новый токен.'
			)
		}

		await existingToken.destroy()

		return true
	}

	async sendTwoFactorToken(email: string): Promise<boolean> {
		const twoFactorToken = await this.generateTwoFactorToken(email)

		await this.mailService.sendTwoFactorTokenEmail(
			twoFactorToken.email,
			twoFactorToken.token
		)

		return true
	}

	private async generateTwoFactorToken(email: string): Promise<Token> {
		const token = Math.floor(
			Math.random() * (1000000 - 100000) + 100000
		).toString()
		const expiresIn = new Date(new Date().getTime() + ms('15M'))

		const existingToken = await this.tokenModel.findOne({
			where: {
				email: email,
				type: TOKEN_TYPE.TWO_FACTOR,
			},
		})

		if (existingToken) {
			await existingToken.destroy()
		}

		const twoFactorToken = await this.tokenModel.create({
			email: email,
			token: token,
			expiresAt: expiresIn,
			type: TOKEN_TYPE.TWO_FACTOR,
		})

		return twoFactorToken
	}
}
