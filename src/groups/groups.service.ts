import {
	BadRequestException,
	Injectable,
	InternalServerErrorException,
	NotFoundException,
} from '@nestjs/common'
import { InjectModel } from '@nestjs/sequelize'
import { Group } from './entities/group.model'
import { GroupAccessService } from './access/group-access.service'
import { GroupDto } from './dto/group.dto'

@Injectable()
export class GroupsService {
	constructor(
		@InjectModel(Group)
		private readonly groupModel: typeof Group,

		private readonly access: GroupAccessService
	) {}

	async create(userID: string, createGroupDto: GroupDto) {
		const transaction = await this.groupModel.sequelize.transaction()

		try {
			const group = await this.groupModel.create(
				{
					ownerID: userID,
					name: createGroupDto.name,
					description: createGroupDto.description ?? null,
					metadata: createGroupDto.metadata ?? null,
				},
				{ transaction }
			)

			await transaction.commit()

			return {
				name: group.name,
				description: group?.description,
			}
		} catch (e) {
			await transaction.rollback()

			const constraint = e.parent?.constraint

			if (constraint === 'ix_group_owner_name') {
				throw new BadRequestException('У вас уже есть группа с таким названием')
			}

			throw new InternalServerErrorException('Что-то пошло не так')
		}
	}

	async update(requesterID: string, updateGroupDto: GroupDto) {
		const transaction = await this.groupModel.sequelize.transaction()

		await this.access.ensureCanManageGroup(requesterID, updateGroupDto.groupID)

		const group = await this.groupModel.findByPk(updateGroupDto.groupID)

		if (!group) {
			throw new NotFoundException('Такая группа не найдена')
		}

		if (group.name === updateGroupDto.name) {
			throw new BadRequestException('Такое название группы уже принято')
		}

		try {
			const result = await group.update(
				{
					name: updateGroupDto?.name,
					description: updateGroupDto?.description,
					//metadata: dto?.metadata,
				},
				{ transaction }
			)

			transaction.commit()

			return result
		} catch (e) {
			transaction.rollback()

			const constraint = e.parent?.constraint

			if (constraint === 'ix_group_owner_name') {
				throw new BadRequestException('У вас уже есть группа с таким названием')
			}

			throw new InternalServerErrorException('Что-то пошло не так')
		}
	}

	async delete(requesterID: string, deleteGroupDto: GroupDto) {
		const transaction = await this.groupModel.sequelize.transaction()

		await this.access.ensureCanManageGroup(requesterID, deleteGroupDto.groupID)

		try {
			await this.groupModel.destroy({
				where: {
					id: deleteGroupDto.groupID,
				},
				transaction,
			})

			transaction.commit()

			return { message: 'Группа удалена' }
		} catch (e) {
			transaction.rollback()

			throw new InternalServerErrorException('Что-то пошло не так')
		}
	}

	// на данном этапе вопрос доступа к группе из вне под вопросом (технически все могут получить группу, а вот действовать с ней уже не все)
	async getGroup(groupID: string): Promise<Group> {
		const group = await this.groupModel.findByPk(groupID)

		if (!group) {
			throw new NotFoundException('Группа не найдена')
		}

		return group
	}

	async getUserGroups(groupID: string, userID: string): Promise<Group[]> {
		const groups = await this.groupModel.findAll({
			where: {
				id: groupID,
				ownerID: userID,
			},
		})

		if (!groups) {
			throw new NotFoundException('Группы не найдена')
		}

		return groups
	}

	// получение одной группы и получение множества
}
