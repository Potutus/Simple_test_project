import {
	Injectable,
	NotFoundException,
	BadRequestException,
	InternalServerErrorException,
} from '@nestjs/common'
import { InjectModel } from '@nestjs/sequelize'
import { GroupRole } from '../entities/group-role.model'
import { Group } from '../entities/group.model'
import { GroupAccessService } from '../access/group-access.service'
import { GroupPermissionService } from '../access/group-permission.service'
import { GroupsService } from '../groups.service'
import { GroupRoleDto } from '../dto/role.dto'

@Injectable()
export class GroupRoleService {
	constructor(
		@InjectModel(GroupRole)
		private readonly groupRoleModel: typeof GroupRole,

		private readonly groupService: GroupsService,
		private readonly access: GroupAccessService,
		private readonly permService: GroupPermissionService
	) {}

	// ---------------------------------------
	// Helpers
	// ---------------------------------------

	/** Убедиться, что группа существует */
	private async ensureGroup(groupID: string): Promise<Group> {
		const group = await this.groupService.getGroup(groupID)

		return group
	}

	/** Убедиться, что роль существует */
	async getRoleOrFail(roleID: string): Promise<GroupRole> {
		const role = await this.groupRoleModel.findByPk(roleID)

		if (!role) {
			throw new NotFoundException('Роль не найдена')
		}

		return role
	}

	// ---------------------------------------
	// CRUD
	// ---------------------------------------

	/**
	 * Создать новую роль
	 */
	async create(userID: string, createRoleDto: GroupRoleDto) {
		await this.ensureGroup(createRoleDto.groupID)

		await this.access.ensureCanManageRoles(userID, createRoleDto.groupID)

		const transaction = await this.groupRoleModel.sequelize.transaction()

		try {
			const role = await this.groupRoleModel.create(
				{
					groupID: createRoleDto.groupID,
					name: createRoleDto.name,
					description: createRoleDto.description ?? null,
					mask: createRoleDto.permissions ?? BigInt(0),
				},
				{ transaction }
			)

			await transaction.commit()

			return role
		} catch (e) {
			await transaction.rollback()

			const constraint = e.parent?.constraint

			if (constraint === 'ix_group_role_owner_name') {
				throw new BadRequestException('Такая роль уже существует')
			}

			throw new InternalServerErrorException('Ошибка при создании роли')
		}
	}

	/**
	 * Получить роли группы
	 */
	async listRoles(groupID: string) {
		//await this.ensureGroup(groupID)

		const result = await this.groupRoleModel.findAll({
			where: {
				groupID: groupID,
			},
			order: [['name', 'ASC']],
		})

		if (!result.length) {
			throw new BadRequestException('Роли не найдены')
		}

		return result
	}

	/**
	 * Обновить роль (НЕ редактирует маску, только данные роли)
	 */
	async update(userID: string, updateRoleDto: GroupRoleDto) {
		const role = await this.getRoleOrFail(updateRoleDto.roleID)

		await this.access.ensureCanManageRoles(userID, role.groupID)

		const transaction = await this.groupRoleModel.sequelize.transaction()

		try {
			await role.update(
				{
					name: updateRoleDto.name ?? role.name,
					description: updateRoleDto.description ?? role.description,
				},
				{
					transaction,
				}
			)

			await transaction.commit()

			return role
		} catch (e) {
			await transaction.rollback()

			const constraint = e.parent?.constraint

			if (constraint === 'ix_group_role_owner_name') {
				throw new BadRequestException(
					'Другая роль с таким именем уже существует'
				)
			}

			throw new InternalServerErrorException('Ошибка при обновлении роли')
		}
	}

	/**
	 * Удалить роль (если она не default)
	 */
	async delete(userID: string, updateRoleDto: GroupRoleDto) {
		const role = await this.getRoleOrFail(updateRoleDto.roleID)

		await this.access.ensureCanManageRoles(userID, role.groupID)

		const transaction = await this.groupRoleModel.sequelize.transaction()

		try {
			await role.destroy({ transaction })

			await transaction.commit()

			return { success: true }
		} catch (e) {
			await transaction.rollback()

			throw new InternalServerErrorException(
				'При удалении роли произошла ошибка'
			)
		}
	}

	// ---------------------------------------
	// Управление маской роли — делегируется PermissionService
	// ---------------------------------------

	/** Добавить разрешение роли */
	async addPermission(userID: string, roleID: string, permission: bigint) {
		const role = await this.getRoleOrFail(roleID)

		await this.access.ensureCanManageRoles(userID, role.groupID)

		await this.permService.addPermission(roleID, permission)

		return { message: 'Доступ роли добавлен' }
	}

	/** Удалить разрешение роли */
	async removePermission(userID: string, roleID: string, permission: bigint) {
		const role = await this.getRoleOrFail(roleID)

		await this.access.ensureCanManageRoles(userID, role.groupID)

		await this.permService.removePermission(roleID, permission)

		return { message: 'Доступ роли удален' }
	}

	/** Полностью заменить маску роли */
	async setMask(userID: string, roleID: string, newMask: bigint) {
		const role = await this.getRoleOrFail(roleID)

		await this.access.ensureCanManageRoles(userID, role.groupID)

		await this.permService.setMask(roleID, newMask)

		return { message: 'Доступ роли изменен' }
	}
}
