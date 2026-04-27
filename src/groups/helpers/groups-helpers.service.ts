import { Injectable, NotFoundException } from '@nestjs/common'
import { InjectModel } from '@nestjs/sequelize'
import { GroupRole } from '../entities/group-role.model'
import { Group } from '../entities/group.model'
import { GroupsService } from '../groups.service'
import { GroupMember, GroupMemberStatus } from '../entities/group-member.model'
import { Op } from 'sequelize'

@Injectable()
export class GroupHelperService {
	constructor(
		@InjectModel(GroupMember)
		private readonly memberModel: typeof GroupMember,

		@InjectModel(GroupRole)
		private readonly groupRoleModel: typeof GroupRole,

		private readonly groupService: GroupsService
	) {}

	async getGroupOrFail(groupID: string): Promise<Group> {
		const group = await this.groupService.getGroup(groupID)

		return group
	}

	async getMemberOrFail(userID: string, groupID: string) {
		const member = await this.memberModel.findOne({
			where: {
				userID: userID,
				groupID: groupID,
			},
			include: [
				{
					model: GroupRole,
				},
			],
		})

		if (!member) {
			throw new NotFoundException('Участник не найден')
		}

		return member
	}

	async getAllGroupsAndRolesByUser(userID: string) {
		const groups = await this.memberModel.findAll({
			where: {
				userID: userID,
				status: GroupMemberStatus.ACTIVE,
			},
			attributes: ['groupID', 'roleID'],
		})

		return groups
	}

	async getRolesByIDs(roleIDs: Array<string>) {
		const roles = await this.groupRoleModel.findAll({
			where: {
				id: {
					[Op.in]: roleIDs,
				},
			},
			attributes: ['mask'],
		})

		return roles
	}
}
