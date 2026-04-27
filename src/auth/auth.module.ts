import { Module, forwardRef } from '@nestjs/common'
import { AuthService } from './auth.service'
import { UsersModule } from 'src/users/users.module'
import { SequelizeModule } from '@nestjs/sequelize'
import { Role } from 'src/roles/entities/roles.model'
import { ArgonService } from './argon2/argon.service'
import { ValidationPipe } from 'src/pipes/validation.pipes'
import { AuthController } from './auth.controller'
import { GoogleRecaptchaModule } from '@nestlab/google-recaptcha'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { getRecaptchaConfig } from 'src/config/recaptcha.config'
import { OauthProviderModule } from './oauth-provider/oauth-provider.module'
import { getProvidersConfig } from 'src/config/oauth-provider.config'
import { Account } from 'src/users/entities/accounts.model'
import { EmailConfirmationModule } from './email-confirmation/email-confirmation.module'
import { TwoFactorAuthService } from './two-factor-auth/two-factor-auth.service'
import { Token } from 'src/users/entities/token.model'
import { MailService } from 'src/libs/mail/mail.service'

@Module({
	imports: [
		SequelizeModule.forFeature([Role, Account, Token]),
		OauthProviderModule.registerAsync({
			imports: [ConfigModule],
			useFactory: getProvidersConfig,
			inject: [ConfigService],
		}),
		GoogleRecaptchaModule.forRootAsync({
			imports: [ConfigModule],
			useFactory: getRecaptchaConfig,
			inject: [ConfigService],
		}),
		UsersModule,
		forwardRef(() => EmailConfirmationModule),
	],
	controllers: [AuthController],
	providers: [AuthService, ArgonService, TwoFactorAuthService, MailService],
	exports: [AuthService],
})
export class AuthModule {}
