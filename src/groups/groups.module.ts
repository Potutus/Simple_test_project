import { Module, forwardRef } from '@nestjs/common'
import { GroupsService } from './groups.service'
import { GroupsController } from './groups.controller'
import { SequelizeModule } from '@nestjs/sequelize'
import { Group } from './entities/group.model'
import { GroupMember } from './entities/group-member.model'
import { GroupRole } from './entities/group-role.model'
import { GroupHelperService } from './helpers/groups-helpers.service'
import { GroupAccessService } from './access/group-access.service'
import { GroupPermissionService } from './access/group-permission.service'
import { UsersService } from 'src/users/users.service'
import { User } from 'src/users/entities/users.model'
import { RolesService } from 'src/roles/roles.service'
import { ArgonService } from 'src/auth/argon2/argon.service'
import { Role } from 'src/roles/entities/roles.model'
import { GroupMemberService } from './member/group-member.service'
import { GroupRoleService } from './roles/group-role.service'

@Module({
	imports: [
		SequelizeModule.forFeature([Group, GroupMember, GroupRole, User, Role]),
	],
	providers: [
		GroupsService,
		GroupHelperService,
		GroupAccessService,
		GroupMemberService,
		GroupRoleService,
		GroupPermissionService,
		UsersService,
		RolesService,
		ArgonService,
	],
	controllers: [GroupsController],
	exports: [
		GroupHelperService,
		GroupsService,
		forwardRef(() => GroupPermissionService),
		forwardRef(() => GroupAccessService),
	],
})
export class GroupsModule {}
