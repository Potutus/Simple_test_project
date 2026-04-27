import { MailerService } from '@nestjs-modules/mailer'
import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { render } from '@react-email/components'

import { ConfirmationTemplate } from './mail-templates/confirmation.template'
import { ResetPasswordTemplate } from './mail-templates/reset-password.template'
import { TwoFactorAuthTemplate } from './mail-templates/two-factor-auth.template'
import { ChangeEmailTemplate } from './mail-templates/change-email.template'
import { OldEmailConfirmationTemplate } from './mail-templates/change-emaill-confirmation.template'

@Injectable()
export class MailService {
	public constructor(
		private readonly mailerService: MailerService,
		private readonly configService: ConfigService
	) {}

	public async sendConfirmationEmail(email: string, token: string) {
		const domain = this.configService.getOrThrow<string>('CLIENT_URL')
		const html = await render(ConfirmationTemplate({ domain, token }))

		return this.sendMail(email, 'Подтверждение почты', html)
	}

	public async sendPasswordResetEmail(email: string, token: string) {
		const domain = this.configService.getOrThrow<string>('CLIENT_URL')
		const html = await render(ResetPasswordTemplate({ domain, token }))

		return this.sendMail(email, 'Сброс пароля', html)
	}

	public async sendChangeEmailTokenEmail(email: string, token: string) {
		const domain = this.configService.getOrThrow<string>('CLIENT_URL')
		const html = await render(ChangeEmailTemplate({ domain, token }))

		return this.sendMail(email, 'Подтверждение новой почты', html)
	}

	public async sendOldEmailConfirmationTokenEmail(
		email: string,
		token: string
	) {
		const html = await render(OldEmailConfirmationTemplate({ token }))

		return this.sendMail(email, 'Подтверждение смены почты', html)
	}

	public async sendTwoFactorTokenEmail(email: string, token: string) {
		const html = await render(TwoFactorAuthTemplate({ token }))

		return this.sendMail(email, 'Подтверждение вашей личности', html)
	}

	private sendMail(email: string, subject: string, html: string) {
		return this.mailerService.sendMail({
			to: email,
			subject,
			html,
		})
	}
}
