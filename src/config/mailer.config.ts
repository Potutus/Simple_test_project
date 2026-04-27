import { ConfigService } from '@nestjs/config'
import { MailerOptions } from '@nestjs-modules/mailer'
import { isDev } from 'src/libs/common/utils/is-dev.utils'

export const getMailerConfig = async (
	configService: ConfigService
): Promise<MailerOptions> => ({
	transport: {
		host: configService.getOrThrow<string>('MAIL_HOST'),
		port: +configService.getOrThrow<number>('MAIL_PORT'),
		secure: !isDev(configService),
		auth: {
			user: configService.getOrThrow<string>('MAIL_LOGIN'),
			pass: configService.getOrThrow<string>('MAIL_PASSWORD'),
		},
	},

	defaults: {
		from: `"Tester message" ${configService.getOrThrow<string>('MAIL_LOGIN')}`,
	},
})
