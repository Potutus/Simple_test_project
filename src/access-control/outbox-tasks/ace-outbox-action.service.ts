import { Injectable, Logger, OnModuleInit } from '@nestjs/common'
import { InjectModel } from '@nestjs/sequelize'
import { AccessControlEntry } from '../entities/acl.model'
import { ConfigService } from '@nestjs/config'
import {
	ACEOutboxTask,
	ACEOutboxTaskCreationAttr,
	OutboxTaskStatus,
	OutboxTaskType,
	OutboxTaskScope,
} from '../entities/acl-outbox-task.model'
import { AceOutboxTaskDto } from '../dto/ace-outbox.dto'
import { upsertACEOutboxTaskQuery } from './sql-queries/upsert-ace-outbox-task.query'
import { uuidv7 } from 'uuidv7'
import { QueryTypes } from 'sequelize'

@Injectable()
export class ACEOutBoxActionService implements OnModuleInit {
	private readonly logger = new Logger(ACEOutBoxActionService.name)
	private maxWriteCount

	constructor(
		@InjectModel(ACEOutboxTask)
		private readonly aceOutboxTaskModel: typeof ACEOutboxTask,

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

	async delete(dtos: AceOutboxTaskDto[]) {
		return await this.aceOutboxAction(
			dtos,
			OutboxTaskType.DELETE,
			OutboxTaskScope.RELATION
		)
	}

	async deleteResource(dtos: AceOutboxTaskDto[]) {
		return await this.aceOutboxAction(
			dtos,
			OutboxTaskType.DELETE,
			OutboxTaskScope.RESOURCE
		)
	}
}
