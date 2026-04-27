import {
	Controller,
	Post,
	Put,
	Delete,
	Get,
	Body,
	Param,
	UsePipes,
	ValidationPipe,
} from '@nestjs/common'
import { GroupsService } from './groups.service'
import { GroupMemberService } from './member/group-member.service'
import { GroupRoleService } from './roles/group-role.service'
import { Authorization } from 'src/auth/decorator/auth.decorator'
import { Authorized } from 'src/auth/decorator/authorizaed.decorator'
import { GroupDto } from './dto/group.dto'
import { GroupMemberDto } from './dto/member.dto'
import { GroupRoleDto } from './dto/role.dto'

@Controller('group')
export class GroupsController {
	constructor(
		private readonly groupService: GroupsService,
		private readonly memberService: GroupMemberService,
		private readonly roleService: GroupRoleService
	) {}

	// ============================================================
	// GROUP — CRUD
	// ============================================================

	@Post()
	@UsePipes(ValidationPipe)
	@Authorization()
	createGroup(
		@Authorized('id') userID: string,
		@Body() createGroupDto: GroupDto
	) {
		return this.groupService.create(userID, createGroupDto)
	}

	@Put()
	@UsePipes(ValidationPipe)
	@Authorization()
	updateGroup(
		@Authorized('id') userID: string,
		@Body() updateGroupDto: GroupDto
	) {
		return this.groupService.update(userID, updateGroupDto)
	}

	@Delete()
	@UsePipes(ValidationPipe)
	@Authorization()
	deleteGroup(
		@Authorized('id') userID: string,
		@Body() deleteGroupDto: GroupDto
	) {
		return this.groupService.delete(userID, deleteGroupDto)
	}

	@Get('/one/:groupID')
	@Authorization()
	getGroup(
		@Authorized('id') userID: string,
		@Param('groupID') groupID: string
	) {
		return this.groupService.getGroup(groupID)
	}

	@Get('/all')
	@Authorization()
	getUserGroups(
		@Authorized('id') userID: string,
		@Param('groupID') groupID: string
	) {
		return this.groupService.getUserGroups(groupID, userID)
	}

	// ============================================================
	// MEMBERS
	// ============================================================

	@Post('/join')
	@Authorization()
	@UsePipes(ValidationPipe)
	requestJoin(
		@Authorized('id') userID: string,
		@Body() requestJoinDto: GroupMemberDto
	) {
		return this.memberService.requestJoin(userID, requestJoinDto.groupID)
	}

	@Post('/invite')
	@Authorization()
	@UsePipes(ValidationPipe)
	inviteUser(
		@Authorized('id') adminID: string,
		@Body() inviteMemberDto: GroupMemberDto
	) {
		return this.memberService.inviteUser(
			adminID,
			inviteMemberDto.groupID,
			inviteMemberDto.userID
		)
	}

	@Post('/accept')
	@Authorization()
	acceptInvite(
		@Authorized('id') userID: string,
		@Body() acceptMemberDto: GroupMemberDto
	) {
		return this.memberService.acceptInvite(userID, acceptMemberDto.groupID)
	}

	@Post('/approve')
	@Authorization()
	@UsePipes(ValidationPipe)
	approveRequest(
		@Authorized('id') adminID: string,
		@Body() approveRequestDto: GroupMemberDto
	) {
		return this.memberService.approveRequest(
			adminID,
			approveRequestDto.groupID,
			approveRequestDto.userID
		)
	}

	@Delete('/leave')
	@Authorization()
	leaveGroup(
		@Authorized('id') userID: string,
		@Body() leaveGroupDto: GroupMemberDto
	) {
		return this.memberService.leaveGroup(userID, leaveGroupDto.groupID)
	}

	@Delete('/member')
	@Authorization()
	@UsePipes(ValidationPipe)
	removeMember(
		@Authorized('id') adminID: string,
		@Body() removeMemberDto: GroupMemberDto
	) {
		return this.memberService.removeMember(
			adminID,
			removeMemberDto.groupID,
			removeMemberDto.userID
		)
	}

	@Get('/members')
	@Authorization()
	listMembers(
		@Authorized('id') userID: string,
		@Body() listMemberDto: GroupMemberDto
	) {
		return this.memberService.listMembers(userID, listMemberDto.groupID)
	}

	// ============================================================
	// ROLES
	// ============================================================

	@Post('/roles')
	@Authorization()
	@UsePipes(ValidationPipe)
	createRole(
		@Authorized('id') adminID: string,
		@Body() createRoleDto: GroupRoleDto
	) {
		return this.roleService.create(adminID, createRoleDto)
	}

	@Put('/roles')
	@Authorization()
	@UsePipes(ValidationPipe)
	updateRole(
		@Authorized('id') adminID: string,
		@Body() updateRoleDto: GroupRoleDto
	) {
		return this.roleService.update(adminID, updateRoleDto)
	}

	@Delete('/roles')
	@Authorization()
	@UsePipes(ValidationPipe)
	deleteRole(
		@Authorized('id') adminID: string,
		@Body() deleteRoleDto: GroupRoleDto
	) {
		return this.roleService.delete(adminID, deleteRoleDto)
	}

	@Post('/roles/assign')
	@Authorization()
	@UsePipes(ValidationPipe)
	assignRole(
		@Authorized('id') adminID: string,
		@Body() assignRoleDto: GroupRoleDto
	) {
		return this.memberService.assignRole(
			adminID,
			assignRoleDto.groupID,
			assignRoleDto.userID,
			assignRoleDto.roleID
		)
	}

	@Post('/roles/clear')
	@Authorization()
	@UsePipes(ValidationPipe)
	clearRole(
		@Authorized('id') adminID: string,
		@Body() clearRoleDto: GroupRoleDto
	) {
		return this.memberService.clearRole(
			adminID,
			clearRoleDto.groupID,
			clearRoleDto.userID
		)
	}

	@Get('/:groupID/roles')
	@Authorization()
	getRoles(
		@Authorized('id') adminID: string,
		@Param('groupID') groupID: string
	) {
		return this.roleService.listRoles(groupID)
	}

	@Post('/roles/permission')
	@Authorization()
	@UsePipes(ValidationPipe)
	addPermission(
		@Authorized('id') userID: string,
		@Body() addRolePermissionDto: GroupRoleDto
	) {
		return this.roleService.addPermission(
			userID,
			addRolePermissionDto.roleID,
			addRolePermissionDto.permissions
		)
	}

	@Delete('/roles/permission')
	@Authorization()
	@UsePipes(ValidationPipe)
	removePermission(
		@Authorized('id') userID: string,
		@Body() removeRolePermissionDto: GroupRoleDto
	) {
		return this.roleService.removePermission(
			userID,
			removeRolePermissionDto.roleID,
			removeRolePermissionDto.permissions
		)
	}

	@Put('/roles/permission')
	@Authorization()
	@UsePipes(ValidationPipe)
	setPermission(
		@Authorized('id') userID: string,
		@Body() setRolePermissionDto: GroupRoleDto
	) {
		return this.roleService.setMask(
			userID,
			setRolePermissionDto.roleID,
			setRolePermissionDto.permissions
		)
	}
}
