import {
	Injectable,
	NotFoundException,
	ForbiddenException,
	InternalServerErrorException,
	BadRequestException,
} from '@nestjs/common'
import { InjectModel } from '@nestjs/sequelize'
import { GroupMember, GroupMemberStatus } from '../entities/group-member.model'
import { GroupRole } from '../entities/group-role.model'
import { GroupAccessService } from '../access/group-access.service'
import { GroupHelperService } from '../helpers/groups-helpers.service'

@Injectable()
export class GroupMemberService {
	constructor(
		@InjectModel(GroupMember)
		private readonly memberModel: typeof GroupMember,

		@InjectModel(GroupRole)
		private readonly roleModel: typeof GroupRole,
		private readonly access: GroupAccessService,
		private readonly groupHelperService: GroupHelperService
	) {}

	// --------------------------------------------------------------------
	// JOIN / INVITE / ACCEPT / LEAVE
	// --------------------------------------------------------------------

	/**
	 * Пользователь подаёт заявку на вступление.
	 * Статус: REQUESTED
	 */
	async requestJoin(userID: string, groupID: string) {
		const group = await this.groupHelperService.getGroupOrFail(groupID)

		const transaction = await this.memberModel.sequelize.transaction()

		try {
			const result = await this.memberModel.create(
				{
					groupID: group.id,
					userID: userID,
					status: GroupMemberStatus.REQUESTERD,
				},
				{ transaction }
			)

			await transaction.commit()

			return result
		} catch (e) {
			await transaction.rollback()

			const constraint = e.parent?.constraint

			if (constraint === 'ix_group_user_id') {
				throw new BadRequestException(
					'Вы уже учатсник группы, или отправили запрос'
				)
			}

			throw new InternalServerErrorException(
				'При подаче заявки в группу произошла ошибка'
			)
		}
	}

	/**
	 * Владелец или пользователь с MEMBERS_MANAGE приглашает в группу.
	 * Статус: PENDING
	 */
	async inviteUser(adminID: string, groupID: string, targetUserID: string) {
		await this.access.ensureCanInvite(adminID, groupID)

		const transaction = await this.memberModel.sequelize.transaction()

		try {
			const result = await this.memberModel.create(
				{
					groupID: groupID,
					userID: targetUserID,
					status: GroupMemberStatus.PENDING,
				},
				{ transaction }
			)

			await transaction.commit()

			return result
		} catch (e) {
			await transaction.rollback()

			const constraint = e.parent?.constraint

			if (constraint === 'ix_group_user_id') {
				throw new BadRequestException('Этот пользователь уже был приглашён')
			}

			throw new InternalServerErrorException(
				'При приглашении пользователя призошла ошибка'
			)
		}
	}

	/**
	 * Пользователь принимает приглашение
	 */
	async acceptInvite(userID: string, groupID: string) {
		const member = await this.groupHelperService.getMemberOrFail(
			userID,
			groupID
		)

		if (member.status !== GroupMemberStatus.PENDING) {
			throw new ForbiddenException('Нет приглашения')
		}

		const transaction = await this.memberModel.sequelize.transaction()

		try {
			await member.update(
				{
					status: GroupMemberStatus.ACTIVE,
				},
				{
					transaction,
				}
			)

			await transaction.commit()

			return member
		} catch (e) {
			await transaction.rollback()

			throw new InternalServerErrorException(
				'При принятии приглащения произошла ошибка'
			)
		}
	}

	/**
	 * Админ одобряет заявку REQUESTED -> ACTIVE
	 */
	async approveRequest(adminID: string, groupID: string, userID: string) {
		await this.access.ensureCanInvite(adminID, groupID)

		const member = await this.groupHelperService.getMemberOrFail(
			userID,
			groupID
		)

		if (member.status !== GroupMemberStatus.REQUESTERD) {
			throw new ForbiddenException('Нет запроса на вступление')
		}

		const transaction = await this.memberModel.sequelize.transaction()

		try {
			await member.update(
				{
					status: GroupMemberStatus.ACTIVE,
				},
				{ transaction }
			)

			await transaction.commit()

			return member
		} catch (e) {
			await transaction.rollback()

			throw new InternalServerErrorException('Что-то пошло не так')
		}
	}

	/**
	 * Пользователь может покинуть группу сам
	 */
	async leaveGroup(userID: string, groupID: string) {
		const member = await this.groupHelperService.getMemberOrFail(
			userID,
			groupID
		)

		const transaction = await this.memberModel.sequelize.transaction()

		try {
			await member.destroy({ transaction })

			await transaction.commit()

			return true
		} catch (e) {
			await transaction.rollback()

			throw new InternalServerErrorException(
				'При покидания группы произошла ошибка'
			)
		}
	}

	/**
	 * Админ может исключить участника
	 */
	async removeMember(adminID: string, groupID: string, userID: string) {
		await this.access.ensureCanKick(adminID, groupID)

		const target = await this.groupHelperService.getMemberOrFail(
			userID,
			groupID
		)

		const group = await this.groupHelperService.getGroupOrFail(groupID)

		if (group.ownerID === userID) {
			throw new ForbiddenException('Нельзя удалить владельца группы')
		}

		const transaction = await this.memberModel.sequelize.transaction()

		try {
			await target.destroy({ transaction })

			await transaction.commit()

			return true
		} catch (e) {
			await transaction.rollback()

			throw new InternalServerErrorException(
				'При исключении участника произошла ошибка'
			)
		}
	}

	// --------------------------------------------------------------------
	// ROLES
	// --------------------------------------------------------------------

	/**
	 * Назначить роль участнику
	 */
	async assignRole(
		adminID: string,
		groupID: string,
		userID: string,
		roleID: string
	) {
		await this.access.ensureCanManageRoles(adminID, groupID)

		const member = await this.groupHelperService.getMemberOrFail(
			userID,
			groupID
		)

		const role = await this.roleModel.findOne({
			where: {
				id: roleID,
				groupID: groupID,
			},
		})

		if (!role) {
			throw new NotFoundException('Роль не найдена')
		}

		const transaction = await this.memberModel.sequelize.transaction()

		try {
			await member.update(
				{
					roleID: role.id,
				},
				{ transaction }
			)

			await transaction.commit()

			await member.reload()

			return member
		} catch (e) {
			await transaction.rollback()

			throw new InternalServerErrorException(
				'При назначении роли произошла ошибка'
			)
		}
	}

	/**
	 * Убрать роль (оставить null)
	 */
	async clearRole(adminID: string, groupID: string, userID: string) {
		await this.access.ensureCanManageRoles(adminID, groupID)

		const member = await this.groupHelperService.getMemberOrFail(
			userID,
			groupID
		)

		const transaction = await this.memberModel.sequelize.transaction()

		try {
			await member.update(
				{
					roleID: null,
				},
				{ transaction }
			)

			await transaction.commit()

			await member.reload()

			return member
		} catch (e) {
			await transaction.rollback()

			throw new InternalServerErrorException(
				'При убирании роли с пользователя произошла ошибка'
			)
		}
	}

	// --------------------------------------------------------------------
	// VIEW / LIST
	// --------------------------------------------------------------------

	async listMembers(adminID: string, groupID: string) {
		await this.access.ensureCanView(adminID, groupID)

		const result = await this.memberModel.findAll({
			where: { groupID: groupID },
			include: [{ model: GroupRole }],
			order: [['status', 'ASC']],
		})

		return result
	}
}
