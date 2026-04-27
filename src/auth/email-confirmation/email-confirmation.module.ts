import { Module, forwardRef } from '@nestjs/common'
import { EmailConfirmationService } from './email-confirmation.service'
import { EmailConfirmationController } from './email-confirmation.controller'
import { SequelizeModule } from '@nestjs/sequelize'
import { User } from 'src/users/entities/users.model'
import { Token } from 'src/users/entities/token.model'
import { AuthService } from '../auth.service'
import { MailService } from 'src/libs/mail/mail.service'
import { UsersService } from 'src/users/users.service'
import { MailModule } from 'src/libs/mail/mail.module'
import { AuthModule } from '../auth.module'
import { Account } from 'src/users/entities/accounts.model'
import { ArgonService } from '../argon2/argon.service'
import { OauthProviderService } from '../oauth-provider/oauth-provider.service'
import { RolesService } from 'src/roles/roles.service'
import { OauthProviderModule } from '../oauth-provider/oauth-provider.module'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { getProvidersConfig } from 'src/config/oauth-provider.config'
import { Role } from 'src/roles/entities/roles.model'
import { TwoFactorAuthService } from '../two-factor-auth/two-factor-auth.service'

@Module({
	imports: [
		SequelizeModule.forFeature([User, Token, Account, Role, Token]),
		MailModule,
		forwardRef(() => AuthModule),
		OauthProviderModule.registerAsync({
			imports: [ConfigModule],
			useFactory: getProvidersConfig,
			inject: [ConfigService],
		}),
	],
	controllers: [EmailConfirmationController],
	providers: [
		EmailConfirmationService,
		AuthService,
		MailService,
		UsersService,
		ArgonService,
		RolesService,
		TwoFactorAuthService,
	],
	exports: [EmailConfirmationService],
})
export class EmailConfirmationModule {}
