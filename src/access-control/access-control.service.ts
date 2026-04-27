import {
	Injectable,
	Logger,
	BadRequestException,
	NotFoundException,
	OnModuleInit,
	HttpException,
	InternalServerErrorException,
} from '@nestjs/common'
import { InjectModel } from '@nestjs/sequelize'
import {
	SpiceDBService,
	SpiceDbBatchOp,
	SpiceObject,
} from './auth-n/spicedb.service' // Путь к твоему сервису
import {
	ACESubjectRelation,
	AccessControlEntry,
	AccessControlEntryStatus,
} from './entities/acl.model'
import {
	CheckPermissionDto,
	GrantPermissionDto,
	RevokePermissionDto,
} from './dto/permission.dto'
import {
	AclPermission,
	AclRelation,
	AclResource,
	AclSubject,
	CaveatNames,
	ValidResourceRelations,
	ValidSubjectRelations,
} from './constants/access-control.constants'
import { getSharedAccessQuery } from './sql-queries/get-shared-access.query'
import { Op, QueryTypes, Transaction } from 'sequelize'
import { getResourceSubjectsQuery } from './sql-queries/get-resource-subjects.query'
import { ConfigService } from '@nestjs/config'
import { deleteResourceFromACEQuery } from './sql-queries/delete-resource-ace.query'
import { ACEOutBoxActionService } from './outbox-tasks/ace-outbox-action.service'
import { AceOutboxTaskDto } from './dto/ace-outbox.dto'

const multipleValToDel = 3

@Injectable()
export class AccessControlService implements OnModuleInit {
	private readonly logger = new Logger(AccessControlService.name)
	private maxCheckCount
	private maxWriteCount

	constructor(
		@InjectModel(AccessControlEntry)
		private readonly AccesContolModel: typeof AccessControlEntry,

		private readonly spiceDbService: SpiceDBService,
		private readonly configService: ConfigService,
		private readonly aceOutboxTasksService: ACEOutBoxActionService
	) {}

	onModuleInit() {
		this.maxCheckCount = +this.configService.getOrThrow<number>(
			'SPICEDB_MAX_PERM_CHECK_COUNT'
		)
		this.maxWriteCount = +this.configService.getOrThrow<number>(
			'SPICEDB_MAX_WRITE_COUNT'
		)
	}

	/**
	 * Валидация логики: Можно ли дать такое право этому ресурсу?
	 */
	private validateRelation(
		resourceType: AclResource,
		relation: AclRelation,
		subjectType: AclResource,
		subjectRelation: AclRelation
	) {
		const allowed = ValidResourceRelations[resourceType]

		if (!allowed) {
			throw new BadRequestException(`Неизвестный тип ресурса '${resourceType}'`)
		}
		if (!allowed.includes(relation)) {
			throw new BadRequestException(
				`Отношение '${relation}' не верно для данного ресурса '${resourceType}'. Поддерживаются: ${allowed.join(', ')}`
			)
		}

		const allowedSubRelations = ValidSubjectRelations[subjectType]
		const currentSubRel = subjectRelation || AclRelation.EMPTY

		if (!allowedSubRelations) {
			throw new BadRequestException(`Неизвестный тип субъекта: ${subjectType}`)
		}

		if (!allowedSubRelations.includes(currentSubRel)) {
			throw new BadRequestException(
				`Субъект '${subjectType}' не может иметь отношение '${currentSubRel}'. Допустимо: ${allowedSubRelations.join(', ')}`
			)
		}
	}

	/**
	 * Выдать право
	 */
	async grantPermission(
		dtos: Array<GrantPermissionDto>,
		userID: string,
		isOnlySpiceDB: boolean
	): Promise<AccessControlEntry[]> {
		if (!dtos.length) {
			throw new BadRequestException('Список прав пуст')
		}

		return this.applyAclChanges({ grant: dtos }, userID, isOnlySpiceDB)
	}

	/**
	 * Отозвать право
	 */
	async revokePermission(
		dtos: Array<RevokePermissionDto>,
		userID: string,
		isOnlySpiceDB: boolean
	): Promise<void> {
		if (!dtos.length) {
			throw new BadRequestException('Список прав пуст')
		}

		await this.applyAclChanges({ revoke: dtos }, userID, isOnlySpiceDB)
	}

	/**
	 * Универсальный метод применения изменений ACL.
	 */
	async applyAclChanges(
		params: {
			grant?: GrantPermissionDto[]
			revoke?: RevokePermissionDto[]
		},
		userID: string,
		isOnlySpiceDB: boolean
	): Promise<AccessControlEntry[]> {
		const transaction = await this.AccesContolModel.sequelize.transaction()

		const { grant = [], revoke = [] } = params
		this.validateBatchSize(grant.length + revoke.length, this.maxWriteCount)

		const spiceOps = new Array<SpiceDbBatchOp>()
		const sqlUpsertRecords = new Array()
		const sqlDeleteConditions = new Array()

		try {
			for (const dto of revoke) {
				this.validateRelation(
					dto.resourceType,
					dto.relation,
					dto.subjectType,
					dto.subjectRelation
				)

				const identity = this.getIdentityFields(dto)
				sqlDeleteConditions.push(identity)
				spiceOps.push({ operation: 'DELETE', ...this.mapToSpiceTriple(dto) })
			}

			for (const dto of grant) {
				this.validateRelation(
					dto.resourceType,
					dto.relation,
					dto.subjectType,
					dto.subjectRelation
				)

				const caveat = this.buildExpirationCaveat(dto.expiresAt)
				const record = this.mapToSqlRecord(dto, userID, caveat)

				sqlUpsertRecords.push(record)
				spiceOps.push({
					operation: 'TOUCH',
					...this.mapToSpiceTriple(dto),
					caveat: caveat || undefined,
				})
			}

			if (sqlDeleteConditions.length > 0 && !isOnlySpiceDB) {
				await this.AccesContolModel.destroy({
					where: { [Op.or]: sqlDeleteConditions },
					transaction,
				})
			}

			let entries: AccessControlEntry[] = []
			if (sqlUpsertRecords.length > 0 && !isOnlySpiceDB) {
				entries = await this.AccesContolModel.bulkCreate(sqlUpsertRecords, {
					updateOnDuplicate: [
						'relation',
						'subjectRelation',
						'expiresAt',
						'caveatContext',
						'comment',
					],
					conflictAttributes: [
						'resourceType',
						'resourceID',
						'subjectType',
						'subjectID',
						'subjectRelation',
						'relation',
					],
					transaction,
					returning: true,
				})
			}

			await this.spiceDbService.executeBatch(spiceOps)

			await transaction.commit()

			return entries
		} catch (e) {
			await transaction.rollback()

			this.handleAclError(e)
		}
	}

	/*
			async batchResourceDeletion(params: { resource: SpiceObject, batchSize: number }) {
			// 1. Быстрая транзакция в БД
			await this.AccesContolModel.sequelize.transaction(async (t) => {
				await this.AccesContolModel.sequelize.query(deleteResourceFromACEQuery(), {
					replacements: queryParams, type: QueryTypes.DELETE, transaction: t
				});
			});

			// 2. Внешний вызов БЕЗ транзакции БД
			try {
				await this.spiceDbService.batchDeletionResource({...});
			} catch(e) {
				// Если SpiceDB упал, консистентность может нарушиться. 
				// В идеале тут нужен механизм Retry (повторных попыток)
				this.logger.error('SpiceDB delete failed, but ACE is deleted', e);
				throw e; 
			}
		}
	*/

	// private async deleteFromAceBatch(
	// 	resource: SpiceObject,
	// 	batchSize: number
	// ): Promise<number> {
	// 	const query = deleteResourceFromACEQuery() // Внутри должен быть DELETE ... IN (SELECT ... LIMIT $limit)

	// 	const [results, metadata] = await this.aceOutboxTaskModel.sequelize.query(
	// 		query,
	// 		{
	// 			bind: {
	// 				resourceType: resource.type,
	// 				resourceID: resource.id,
	// 				batchLimit: batchSize, // Перешли на bind параметры!
	// 			},
	// 			type: QueryTypes.DELETE,
	// 		}
	// 	)

	// 	// sequelize.query для DELETE обычно возвращает в metadata количество удаленных строк
	// 	const deletedCount = metadata || 0

	// 	this.logger.log(
	// 		`[Batch] Deleted ${deletedCount} rows from ACE where resource=${resource.type}:${resource.id}`
	// 	)
	// 	return deletedCount
	// }

	/**
	 * Массовое удаление ресурсов из ACL.
	 */
	async batchResourceDeletion(params: {
		resource: SpiceObject
		batchSize: number
	}): Promise<void> {
		const transaction = await this.AccesContolModel.sequelize.transaction()

		try {
			const query = deleteResourceFromACEQuery()

			const queryParams = {
				resourceType: params.resource.type,
				resourceID: params.resource.id,
				batchSize: params.batchSize,
			}

			await this.AccesContolModel.sequelize.query(query, {
				replacements: queryParams,
				type: QueryTypes.DELETE,
				transaction,
			})

			await this.spiceDbService.batchDeletionResource({
				resource: params.resource,
				batchSize: params.batchSize,
			})

			await transaction.commit()
		} catch (e) {
			await transaction.rollback()

			this.handleAclError(e)
		}
	}

	/**
	 * Получить список выданых прав на ресурс.
	 */
	async listPermissions(resourceType: AclResource, resourceId: string) {
		return this.AccesContolModel.findAll({
			where: { resourceType, resourceID: resourceId },
			limit: 25,
			order: [['createdAt', 'DESC']],
		})
	}

	/**
	 * Получить список того чем поделился.
	 */
	async getGrantedPermissions(resourceType: AclResource, userID: string) {
		const result = await this.AccesContolModel.findAll({
			where: {
				resourceType: resourceType,
				grantedBy: userID,
			},
			limit: 25,
			order: [['id', 'DESC']],
		})

		return result
	}

	/**
	 * Получить список того чем поделились.
	 * @param resourceType
	 * @param subjectType
	 * @param subjectID
	 */
	async getSharedAccess(
		resourceType: AclResource,
		subjectType: AclResource,
		subjectID: string
	) {
		const limit = 25
		const sortorder = 'DESC'

		const queryParams = {
			resourceType: resourceType,
			subjectType: subjectType,
			subjectID: subjectID,
			limit: limit,
		}

		const query = getSharedAccessQuery(sortorder)

		const sharedList =
			await this.AccesContolModel.sequelize.query<AccessControlEntry>(query, {
				replacements: queryParams,
				type: QueryTypes.SELECT,
			})

		if (!sharedList) {
			throw new NotFoundException('Данных не найдено')
		}

		return sharedList
	}

	/**
	 * Получить список субъектов прав ресурса.
	 */
	async getResourceSubjects(
		resourceType: AclResource,
		resourceID: string,
		userID: string
	) {
		const limit = 25
		const sortorder = 'DESC'

		const queryParams = {
			resourceType: resourceType,
			resourceID: resourceID,
			userID: userID,
			limit: limit,
		}

		const query = getResourceSubjectsQuery(sortorder)

		const resourceSubjectsList =
			await this.AccesContolModel.sequelize.query<AccessControlEntry>(query, {
				replacements: queryParams,
				type: QueryTypes.SELECT,
			})

		if (!resourceSubjectsList) {
			throw new NotFoundException('Данных не найдено')
		}

		return resourceSubjectsList
	}

	/**
	 * Создание задачи внешнего обработчика на создание
	 */
	async createTaskToCreate(dtos: AceOutboxTaskDto[]) {
		await this.aceOutboxTasksService.create(dtos)
	}

	/**
	 * Создание задачи внешнего обработчика на удаление
	 */
	async createTaskToDelete(dtos: AceOutboxTaskDto[]) {
		await this.aceOutboxTasksService.delete(dtos)
	}

	/**
	 * Массовая проверка прав (Batch).
	 * Отправляет один запрос в SpiceDB для всех элементов.
	 * Возвращает массив boolean в том же порядке.
	 */
	async canBatch(checks: CheckPermissionDto[]): Promise<boolean[]> {
		this.validateBatchSize(checks.length, this.maxCheckCount)

		const spiceChecks = checks.map((c) => ({
			resource: {
				type: c.resourceType,
				id: c.resourceID,
			},
			permission: c.action,
			subject: {
				type: c.subjectType,
				id: c.subjectID,
			},
			context: c.contextData || {},
		}))

		return this.spiceDbService.checkBulkPermissions(spiceChecks)
	}

	/**
	 * Одиночная проверка (Обертка над batch для совместимости)
	 */
	async can(
		subjectType: AclSubject,
		subjectId: string,
		action: AclPermission,
		resourceType: AclResource,
		resourceId: string,
		contextData: Record<string, any> = {}
	): Promise<boolean> {
		const [result] = await this.canBatch([
			{
				resourceType: resourceType,
				resourceID: resourceId,
				action: action,
				subjectType: subjectType,
				subjectID: subjectId,
				contextData: contextData,
			},
		])
		return result
	}

	// --- Локальные помощники ---

	private validateBatchSize(size: number, maxCount: number): void {
		if (size === 0) {
			return
		}

		if (size > maxCount) {
			throw new BadRequestException(`Превышен лимит операций: ${maxCount}`)
		}
	}

	private mapToSpiceTriple(dto: GrantPermissionDto | RevokePermissionDto) {
		return {
			resource: {
				type: dto.resourceType,
				id: dto.resourceID,
			},
			relation: dto.relation,
			subject: {
				type: dto.subjectType,
				id: dto.subjectID,
				relation: dto.subjectRelation,
			},
		}
	}

	private buildExpirationCaveat(expiresAt?: Date) {
		if (!expiresAt) {
			return null
		}

		return {
			name: CaveatNames.EXPIRATION,
			context: {
				expiration: Math.floor(expiresAt.getTime() / 1000),
			},
		}
	}

	private handleAclError(e: any): never {
		this.logger.error(`ACL Operation failed: ${e.message}`, e.stack)

		if (
			e.name === 'SequelizeUniqueConstraintError' ||
			e.parent?.constraint === 'ix_ace_unique_link'
		) {
			throw new BadRequestException(
				'Конфликт прав: дублирующаяся запись или нарушение уникальности'
			)
		}

		throw e instanceof HttpException
			? e
			: new InternalServerErrorException('Ошибка при синхронизации прав')
	}

	private mapToSqlRecord(
		dto: GrantPermissionDto,
		userID: string,
		caveat: Record<string, any>
	) {
		const record = {
			resourceType: dto.resourceType,
			resourceID: dto.resourceID,
			subjectType: dto.subjectType,
			subjectID: dto.subjectID,
			subjectRelation: dto.subjectRelation || ACESubjectRelation.BASE_VALUE,
			relation: dto.relation,
			grantedBy: userID,
			comment: dto.comment,
			expiresAt: dto.expiresAt || null,
			caveatContext: caveat,
			syncStatus: AccessControlEntryStatus.SYNCED,
		}

		return record
	}

	private getIdentityFields(dto: GrantPermissionDto) {
		const subRel = dto.subjectRelation || ACESubjectRelation.BASE_VALUE

		const idFields = {
			resourceType: dto.resourceType,
			resourceID: dto.resourceID,
			subjectType: dto.subjectType,
			subjectID: dto.subjectID,
			subjectRelation: subRel,
			relation: dto.relation,
		}

		return idFields
	}
}
