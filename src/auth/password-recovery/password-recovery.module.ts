import { Module } from '@nestjs/common'
import { PasswordRecoveryService } from './password-recovery.service'
import { PasswordRecoveryController } from './password-recovery.controller'
import { UsersService } from 'src/users/users.service'
import { MailService } from 'src/libs/mail/mail.service'
import { SequelizeModule } from '@nestjs/sequelize'
import { Token } from 'src/users/entities/token.model'
import { ArgonService } from '../argon2/argon.service'
import { User } from 'src/users/entities/users.model'
import { RolesService } from 'src/roles/roles.service'
import { Role } from 'src/roles/entities/roles.model'

@Module({
	imports: [SequelizeModule.forFeature([Token, User, Role])],
	controllers: [PasswordRecoveryController],
	providers: [
		PasswordRecoveryService,
		UsersService,
		MailService,
		ArgonService,
		RolesService,
	],
	exports: [PasswordRecoveryService],
})
export class PasswordRecoveryModule {}
