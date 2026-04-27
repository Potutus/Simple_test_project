import { Module } from '@nestjs/common'
import { UsersModule } from './users/users.module'
import { SequelizeModule } from '@nestjs/sequelize'
import { ConfigModule } from '@nestjs/config'
import { SequelizeConfigService } from './config/sequelize-сonfig.service'
import { AuthModule } from './auth/auth.module'
import { RolesModule } from './roles/roles.module'
import { MediaModule } from './media/media.module'
import { TagsModule } from './tags/tags.module'
import { FilesModule } from './files/files.module'
import { ServeStaticModule } from '@nestjs/serve-static'
import { ProfileModule } from './profile/profile.module'
import { WikiModule } from './wiki/wiki.module'
import { SnowflakeModule } from './snowflakeID/snowflake.module'
import * as path from 'path'
import { ThrottlerModule } from '@nestjs/throttler'
import { TagsTypeModule } from './tags-type/tags-type.module'
import { IS_DEV_ENV } from './libs/common/utils/is-dev.utils'
import { OauthProviderModule } from 'src/auth/oauth-provider/oauth-provider.module'
import { MailModule } from './libs/mail/mail.module'
import { EmailConfirmationModule } from './auth/email-confirmation/email-confirmation.module'
import { PasswordRecoveryModule } from './auth/password-recovery/password-recovery.module'
import { TwoFactorAuthModule } from './auth/two-factor-auth/two-factor-auth.module'
import { EmailChangeModule } from './auth/email-change/email-change.module'
import { FileSystemModule } from './file-system/file-system.module'
import { GroupsModule } from './groups/groups.module'
import { AccessControlService } from './access-control/access-control.service'
import { AccessControlController } from './access-control/access-control.controller'
import { AccessControlModule } from './access-control/access-control.module'

@Module({
	imports: [
		ThrottlerModule.forRoot([
			{
				ttl: 60000,
				limit: 15,
			},
		]),
		SequelizeModule.forRootAsync({
			imports: [ConfigModule],
			useClass: SequelizeConfigService,
		}),
		ConfigModule.forRoot({
			isGlobal: true,
			ignoreEnvFile: !IS_DEV_ENV,
		}),
		ServeStaticModule.forRoot({
			serveRoot: '/files',
			rootPath: path.resolve(__dirname, 'static'),
			serveStaticOptions: {
				etag: true,
				index: false,
				cacheControl: true,
				maxAge: '1w',
			},
		}),
		UsersModule,
		AuthModule,
		RolesModule,
		MediaModule,
		TagsModule,
		FilesModule,
		ProfileModule,
		WikiModule,
		SnowflakeModule,
		TagsTypeModule,
		OauthProviderModule,
		MailModule,
		EmailConfirmationModule,
		PasswordRecoveryModule,
		TwoFactorAuthModule,
		EmailChangeModule,
		FileSystemModule,
		GroupsModule,
		AccessControlModule,
	],
})
export class AppModule {}
