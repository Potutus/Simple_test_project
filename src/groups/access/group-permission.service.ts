import {
	Inject,
	Injectable,
	InternalServerErrorException,
	forwardRef,
} from '@nestjs/common'
import { InjectModel } from '@nestjs/sequelize'
import { GroupRole } from '../entities/group-role.model'
import { GroupRoleService } from '../roles/group-role.service'
import { maskAdd, maskRemove } from 'src/utils/permissions/mask-manage.config'

@Injectable()
export class GroupPermissionService {
	constructor(
		@InjectModel(GroupRole)
		private readonly groupRoleModel: typeof GroupRole,

		@Inject(forwardRef(() => GroupRoleService))
		private readonly groupRoleService: GroupRoleService
	) {}

	async getRoleOrFail(roleID: string): Promise<GroupRole> {
		const groupRole = await this.groupRoleService.getRoleOrFail(roleID)

		return groupRole
	}

	async addPermission(roleID: string, perm: bigint) {
		const groupRole = await this.getRoleOrFail(roleID)

		const newMask = maskAdd(groupRole.mask, perm)

		const transaction = await this.groupRoleModel.sequelize.transaction()

		try {
			await groupRole.update(
				{
					mask: newMask,
				},
				{ transaction }
			)

			await transaction.commit()

			return newMask
		} catch (e) {
			await transaction.rollback()

			throw new InternalServerErrorException(
				'При добавлении доступа произошла ошибка'
			)
		}
	}

	async removePermission(roleID: string, perm: bigint) {
		const groupRole = await this.getRoleOrFail(roleID)

		const newMask = maskRemove(groupRole.mask, perm)

		const transaction = await this.groupRoleModel.sequelize.transaction()

		try {
			await groupRole.update(
				{
					mask: newMask,
				},
				{ transaction }
			)

			await transaction.commit()

			return newMask
		} catch (e) {
			await transaction.rollback()

			throw new InternalServerErrorException(
				'При убирании доступа произошла ошибка'
			)
		}
	}

	async setMask(roleID: string, mask: bigint) {
		const groupRole = await this.getRoleOrFail(roleID)

		const transaction = await this.groupRoleModel.sequelize.transaction()

		try {
			await groupRole.update(
				{
					mask,
				},
				{ transaction }
			)

			await transaction.commit()

			return mask
		} catch (e) {
			await transaction.rollback()

			throw new InternalServerErrorException(
				'При смене доступа произошла ошибка'
			)
		}
	}
}
