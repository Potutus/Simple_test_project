import { Module } from '@nestjs/common'
import { TwoFactorAuthService } from './two-factor-auth.service'
import { MailService } from 'src/libs/mail/mail.service'
import { SequelizeModule } from '@nestjs/sequelize'
import { Token } from 'src/users/entities/token.model'

@Module({
	imports: [SequelizeModule.forFeature([Token])],
	providers: [TwoFactorAuthService, MailService],
})
export class TwoFactorAuthModule {}
