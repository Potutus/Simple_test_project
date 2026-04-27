import { Injectable, Logger, OnModuleInit } from '@nestjs/common'
import { InjectModel } from '@nestjs/sequelize'
import { ConfigService } from '@nestjs/config'
import {
	ACEOutboxTask,
	OutboxTaskStatus,
	OutboxTaskType,
	OutboxTaskScope,
	ACETaskDataType,
} from '../entities/acl-outbox-task.model'
import { AceOutboxTaskDto } from '../dto/ace-outbox.dto'
import { upsertACEOutboxTaskQuery } from './sql-queries/upsert-ace-outbox-task.query'
import { uuidv7 } from 'uuidv7'
import { QueryTypes } from 'sequelize'
import { SpiceDBService } from '../auth-n/spicedb.service'
import { InternalBusinessException } from 'src/exception/internal-business.exception'
import { deleteFromACEQuery } from './sql-queries/delete-from-ace.query'
import { pLimit } from 'src/utils/p-limit/p-limit'
import { selectProcessingAceTaskQuery } from './sql-queries/select-processing-ace-task.query'

@Injectable()
export class ACEOutBoxService implements OnModuleInit {
	private readonly logger = new Logger(ACEOutBoxService.name)
	private maxWriteCount

	constructor(
		@InjectModel(ACEOutboxTask)
		private readonly aceOutboxTaskModel: typeof ACEOutboxTask,

		private readonly spiceDbService: SpiceDBService,
		private readonly configService: ConfigService
	) {}

	onModuleInit() {
		this.maxWriteCount = +this.configService.getOrThrow<number>(
			'ACE_MAX_TASK_WRITE_COUNT'
		)
	}

	private async aceOutboxAction(
		dtos: AceOutboxTaskDto[],
		eventType: OutboxTaskType,
		taskScope: OutboxTaskScope
	) {
		const transaction = await this.aceOutboxTaskModel.sequelize.transaction()

		if (dtos.length > this.maxWriteCount) {
			return false
		}

		if (taskScope === OutboxTaskScope.RELATION) {
			const invalidDtos = dtos.filter((dto) => !dto.subjectID)
			if (invalidDtos.length > 0) {
				this.logger.error(
					`Для задач типа RELATION (eventType=${eventType}) требуется subjectID. ` +
						`Найдено записей без subjectID: ${invalidDtos.length}`
				)
				return false
			}
		}

		try {
			const count = dtos.length

			const queryParams = {
				ids: new Array(count),
				resourceIDs: new Array(count),
				subjectIDs: new Array(count),
				scopes: new Array(count),
				eventTypes: new Array(count),
				statuses: new Array(count),
				datas: new Array(count),
				createdAts: new Array(count),
				updatedAts: new Array(count),
			}

			for (let i = 0; i < count; i++) {
				const dto = dtos[i]

				queryParams.ids[i] = uuidv7()
				queryParams.resourceIDs[i] = dto.resourceID
				queryParams.subjectIDs[i] = dto.subjectID || null
				queryParams.scopes[i] = taskScope
				queryParams.eventTypes[i] = eventType
				queryParams.statuses[i] = OutboxTaskStatus.PENDING
				queryParams.datas[i] = JSON.stringify(dto.aceTaskDataType)
			}

			const query = upsertACEOutboxTaskQuery(taskScope)

			await this.aceOutboxTaskModel.sequelize.query(query, {
				bind: queryParams,
				type: QueryTypes.INSERT,
				transaction: transaction,
			})

			await transaction.commit()

			return true
		} catch (e) {
			await transaction.rollback()

			this.logger.error(
				`При работе с правами что-то пошло не так. Ошибка: ${e}`
			)

			return false
		}
	}

	async create(dtos: AceOutboxTaskDto[]) {
		return await this.aceOutboxAction(
			dtos,
			OutboxTaskType.CREATE,
			OutboxTaskScope.RELATION
		)
	}

	async delete(limit: number) {
		const transaction = await this.aceOutboxTaskModel.sequelize.transaction()

		if (limit > this.maxWriteCount) {
			return false
		}

		try {
			/**
			 * Получение
			 * Удаление в спайсДБ
			 * Сохранение промежуточного результата
			 * Как только оба параметра по кол-ву удалений дойдет до предела, пометить на удаление задачу
			 */
			const tasks = await this.aceOutboxTaskModel.findAll({
				where: {
					eventType: OutboxTaskType.DELETE,
					status: OutboxTaskStatus.PENDING,
				},
				limit: limit,
				transaction: transaction,
				lock: transaction.LOCK.UPDATE,
				skipLocked: true,
			})

			await transaction.commit()

			return true
		} catch (e) {
			await transaction.rollback()

			this.logger.error(
				`При работе с правами что-то пошло не так. Ошибка: ${e}`
			)

			return false
		}
	}

	/// ------------------------------------------------------------------------------------

	/**
	 * Обработка Задач на удаление
	 * @param limit предел задач на запрос
	 * @param batchSize предел пачки задач
	 * @returns
	 */
	async processDeleteTasks(limit: number, batchSize: number = 1000) {
		//const pLimit = await loadEsm('p-limit')

		this.logger.debug(` -                  --- -----`)

		const transaction = await this.aceOutboxTaskModel.sequelize.transaction()

		if (limit > this.maxWriteCount) {
			return false
		}

		let tasks: ACEOutboxTask[]

		try {
			tasks = await this.aceOutboxTaskModel.findAll({
				where: {
					eventType: OutboxTaskType.DELETE,
					status: OutboxTaskStatus.PENDING,
				},
				limit: limit,
				transaction: transaction,
				lock: transaction.LOCK.UPDATE,
				skipLocked: true,
			})

			if (!tasks.length) {
				await transaction.commit()
				return
			}

			await this.aceOutboxTaskModel.update(
				{
					status: OutboxTaskStatus.PROCESSING,
				},
				{
					where: {
						id: tasks.map((t) => t.id),
					},
					transaction,
				}
			)

			await transaction.commit()

			//await transaction.commit()

			//return true
		} catch (e) {
			await transaction.rollback()

			this.logger.error(
				`При работе с правами что-то пошло не так. Ошибка: ${e}`
			)

			return false
		}

		const concurrentLimit = pLimit(5)

		await Promise.all(
			tasks.map((task) =>
				concurrentLimit(() => this.processSingleDeleteTask(task, batchSize))
			)
		)

		this.logger.debug(`END OF PROCESSING `)

		return true
	}

	private async processSingleDeleteTask(
		task: ACEOutboxTask,
		batchSize: number
	) {
		// Получаем данные или создаем пустой объект
		const data: ACETaskDataType = task.data || {}
		let updated = false

		this.logger.debug(`PROCESSING SINGLE TASK`)

		// Инициализация стейта удаления при первом проходе
		if (!data.deleteState) {
			data.deleteState = {
				spiceResourceDone: false,
				spiceSubjectDone: false,
				aceDone: false,
			}
			updated = true
		}

		const state = data.deleteState
		// Берем resourceType из payload'а, а ID — прямо из колонки модели
		const resourceType = data.spiceDB?.resource?.type
		const resourceID = task.resourceID

		if (!resourceType) {
			this.logger.error(`Отсутствует resourceType в задаче ${task.id}`)
			throw new Error(`Отсутствует resourceType в задаче ${task.id}`)
		}

		try {
			// Этап 1: Удаление ресурса в SpiceDB
			if (!state.spiceResourceDone) {
				const deleted = await this.spiceDbService.deleteByResource(
					{
						type: resourceType,
						id: resourceID,
					},
					batchSize
				)

				// Обновляем статистику в колонке БД
				task.spiceDBDeleted = BigInt(task.spiceDBDeleted || 0) + BigInt(deleted)

				if (deleted < batchSize) {
					state.spiceResourceDone = true
				}
				updated = true
			}

			// Этап 2: Удаление субъекта в SpiceDB (если требуется по логике)
			if (state.spiceResourceDone && !state.spiceSubjectDone) {
				const deleted = await this.spiceDbService.deleteBySubject(
					{
						type: resourceType,
						id: resourceID,
					},
					batchSize
				)

				task.spiceDBDeleted = BigInt(task.spiceDBDeleted || 0) + BigInt(deleted)

				if (deleted < batchSize) {
					state.spiceSubjectDone = true
				}
				updated = true
			}

			// Этап 3: Удаление из локальной БД (ACE)
			if (state.spiceResourceDone && state.spiceSubjectDone && !state.aceDone) {
				const { count } = await this.deleteFromAceBatch(
					resourceType,
					resourceID,
					batchSize
				)

				task.aceDeleted = BigInt(task.aceDeleted || 0) + BigInt(count)

				if (count < batchSize) {
					state.aceDone = true
				}
				updated = true
			}

			// Финализация
			if (state.spiceResourceDone && state.spiceSubjectDone && state.aceDone) {
				task.status = OutboxTaskStatus.COMPLETED

				task.changed('data', true)
				task.data = data

				await task.save()
			} else if (updated) {
				task.changed('data', true)
				task.data = data

				await task.save()
			}
		} catch (e) {
			// Логика повторов с задержкой

			this.logger.error(
				`При обработки задачи на удаление что-то пошло не так. Ошибка: ${e}`
			)

			throw new InternalBusinessException(
				`При удалении ресурсов что-то пошло не так`
			)
		}
	}

	private async deleteFromAceBatch(
		resourceType: string,
		resourceID: string,
		limit: number
	) {
		const query = deleteFromACEQuery()

		const queryParams = {
			resourceType: resourceType,
			resourceID: resourceID,
			batchSize: limit,
		}

		const result = await this.aceOutboxTaskModel.sequelize.query<{
			del_count: number
		}>(query, {
			bind: queryParams,
			type: QueryTypes.SELECT,
		})

		const count = result[0]?.del_count || 0

		return { count: count }
	}

	// -----------------------------------------------
	/**
	 * Обработка зависших задач (всех типов)
	 * @param limit предел задач на запрос
	 * @returns
	 */
	async proceedACEProcessingTasks(limit: number) {
		if (limit > this.maxWriteCount) {
			return false
		}

		const transaction = await this.aceOutboxTaskModel.sequelize.transaction()

		try {
			const query = selectProcessingAceTaskQuery()

			const queryParams = {
				selectTaskLimit: limit,
			}

			await this.aceOutboxTaskModel.sequelize.query(query, {
				bind: queryParams,
				type: QueryTypes.UPDATE,
				transaction: transaction,
			})

			await transaction.commit()

			return true
		} catch (e) {
			await transaction.rollback()

			this.logger.error(
				`При обработке застоявшихся процессов что-то пошо не так. Ошибка: ${e}`
			)

			throw new InternalBusinessException(
				'При обработке застоявшихся процессов что-то пошо не так'
			)
		}
	}
}
