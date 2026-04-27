import { Module } from '@nestjs/common'
import { UsersService } from 'src/users/users.service'
import { MailService } from 'src/libs/mail/mail.service'
import { SequelizeModule } from '@nestjs/sequelize'
import { Token } from 'src/users/entities/token.model'
import { User } from 'src/users/entities/users.model'
import { Role } from 'src/roles/entities/roles.model'
import { EmailChangeService } from './email-change.service'
import { EmailChangeController } from './email-change.controller'
import { RolesService } from 'src/roles/roles.service'
import { ArgonService } from '../argon2/argon.service'

@Module({
	imports: [SequelizeModule.forFeature([Token, User, Role])],
	controllers: [EmailChangeController],
	providers: [
		EmailChangeService,
		UsersService,
		MailService,
		RolesService,
		ArgonService,
	],
	exports: [EmailChangeService],
})
export class EmailChangeModule {}
