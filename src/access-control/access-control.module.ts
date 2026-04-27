import { Module } from '@nestjs/common'
import { SequelizeModule } from '@nestjs/sequelize'
import { AccessControlEntry } from './entities/acl.model'
import { AccessControlService } from './access-control.service'
import { AccessControlController } from './access-control.controller'
import { SpiceDBService } from './auth-n/spicedb.service'
import { UsersService } from 'src/users/users.service'
import { User } from 'src/users/entities/users.model'
import { RolesService } from 'src/roles/roles.service'
import { ArgonService } from 'src/auth/argon2/argon.service'
import { Role } from 'src/roles/entities/roles.model'
import { ACEOutBoxActionService } from './outbox-tasks/ace-outbox-action.service'
import { ACEOutboxTask } from './entities/acl-outbox-task.model'
import { OutboxWorkerService } from './outbox-tasks/ace-outbox-worker.service'
import { ACEOutBoxService } from './outbox-tasks/ace-outbox.service'

@Module({
	imports: [
		SequelizeModule.forFeature([AccessControlEntry, User, Role, ACEOutboxTask]),
	],
	providers: [
		AccessControlService,
		SpiceDBService,
		UsersService,
		RolesService,
		ArgonService,
		ACEOutBoxActionService,
		OutboxWorkerService,
		ACEOutBoxService,
	],
	controllers: [AccessControlController],
	exports: [AccessControlService, ACEOutBoxActionService],
})
export class AccessControlModule {}
