import {
	Injectable,
	ForbiddenException,
	NotFoundException,
	Inject,
	forwardRef,
} from '@nestjs/common'
import { InjectModel } from '@nestjs/sequelize'
import { Group } from '../entities/group.model'
import { GroupMember, GroupMemberStatus } from '../entities/group-member.model'
import { GroupsService } from '../groups.service'
import { GROUP_ACL_MASK } from 'src/utils/permissions/group-permissions.config'
import { maskHas } from 'src/utils/permissions/mask-manage.config'
import { GroupHelperService } from '../helpers/groups-helpers.service'

@Injectable()
export class GroupAccessService {
	constructor(
		@InjectModel(Group)
		private readonly groupModel: typeof Group,

		@InjectModel(GroupMember)
		private readonly memberModel: typeof GroupMember,

		@Inject(forwardRef(() => GroupsService))
		private readonly groupService: GroupsService,

		@Inject(forwardRef(() => GroupHelperService))
		private readonly groupHelperService: GroupHelperService
	) {}

	// -------------------------------------------------------
	// FETCH HELPERS
	// -------------------------------------------------------

	async getGroupOrFail(groupID: string): Promise<Group> {
		const group = await this.groupService.getGroup(groupID)

		return group
	}

	async getMemberRecord(userID: string, groupID: string): Promise<GroupMember> {
		const member = this.groupHelperService.getMemberOrFail(userID, groupID)

		return member
	}

	// -------------------------------------------------------
	// PERMISSION RESOLUTION
	// -------------------------------------------------------

	/**
	 * Определяет права пользователя в группе:
	 * - если владелец → owner=true
	 * - иначе берём mask из роли (если статус ACTIVE)
	 */
	async resolveUserPermissions(
		userID: string,
		groupID: string
	): Promise<{
		isOwner: boolean
		mask: bigint
	}> {
		const group = await this.getGroupOrFail(groupID)

		const maxMaskPerm: bigint = 0xffffffffffffffffn // BigInt с установленными 64 битами

		// owner → имеет все права
		if (group.ownerID === userID) {
			return {
				isOwner: true,
				mask: maxMaskPerm,
			}
		}

		// ищем членство
		const member = await this.getMemberRecord(userID, groupID)

		if (member.status !== GroupMemberStatus.ACTIVE) {
			return {
				isOwner: false,
				mask: BigInt(0),
			}
		}

		let mask = BigInt(0)

		if (member.role) {
			mask = BigInt(member.role.mask ?? 0)
		}

		return {
			isOwner: false,
			mask,
		}
	}

	// -------------------------------------------------------
	// Boolean check: mask contains permission?
	// -------------------------------------------------------

	/** Побитовая проверка → есть доступ или нет */
	async hasPermission(
		userID: string,
		groupID: string,
		requiredMask: bigint
	): Promise<boolean> {
		const resolved = await this.resolveUserPermissions(userID, groupID)

		if (resolved.isOwner) {
			return true
		}

		// Побитовое сравнение:
		// (mask & requiredMask) === requiredMask
		const result = maskHas(resolved.mask, BigInt(requiredMask))

		return result
	}

	async isOwner(userID: string, groupID: string): Promise<boolean> {
		const group = await this.groupModel.findByPk(groupID)

		if (!group) {
			throw new NotFoundException('Группа не найдена')
		}

		return group.ownerID === userID
	}

	async isActiveMember(userID: string, groupID: string): Promise<boolean> {
		const result = await this.memberModel.findOne({
			where: {
				userID: userID,
				groupID: groupID,
				status: GroupMemberStatus.ACTIVE,
			},
		})
		return !!result
	}

	// -------------------------------------------------------
	// ENSURE METHODS (throw)
	// -------------------------------------------------------

	async ensureCanView(userID: string, groupID: string) {
		if (await this.isOwner(userID, groupID)) {
			return true
		}

		if (await this.isActiveMember(userID, groupID)) {
			return true
		}

		const ok = await this.hasPermission(userID, groupID, GROUP_ACL_MASK.VIEW)

		if (!ok) {
			throw new ForbiddenException('Нет прав на просмотр группы')
		}
	}

	async ensureCanManageGroup(userID: string, groupID: string) {
		const ok = await this.hasPermission(
			userID,
			groupID,
			GROUP_ACL_MASK.SETTINGS_MANAGE
		)

		if (!ok) {
			throw new ForbiddenException('Нет прав на управление настройками группы')
		}
	}

	async ensureCanManageRoles(userID: string, groupID: string) {
		const ok = await this.hasPermission(
			userID,
			groupID,
			GROUP_ACL_MASK.ROLES_MANAGE
		)

		if (!ok) {
			throw new ForbiddenException('Нет прав на управление ролями группы')
		}
	}

	async ensureCanInvite(userID: string, groupID: string) {
		const ok = await this.hasPermission(
			userID,
			groupID,
			GROUP_ACL_MASK.MEMBERS_MANAGE
		)

		if (!ok) {
			throw new ForbiddenException('Нет прав приглашать участников')
		}
	}

	async ensureCanKick(userID: string, groupID: string) {
		const ok = await this.hasPermission(
			userID,
			groupID,
			GROUP_ACL_MASK.MEMBERS_MANAGE
		)

		if (!ok) {
			throw new ForbiddenException('Нет прав исключать участников')
		}
	}

	// -------------------------------------------------------
	// Utility
	// -------------------------------------------------------

	async getUserMask(userID: string, groupID: string): Promise<bigint> {
		const resolved = await this.resolveUserPermissions(userID, groupID)

		return resolved.mask
	}
}
