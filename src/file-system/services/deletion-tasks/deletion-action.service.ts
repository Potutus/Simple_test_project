import {
	BadRequestException,
	ConflictException,
	Injectable,
	Logger,
	NotFoundException,
} from '@nestjs/common'
import { InjectModel } from '@nestjs/sequelize'
import {
	DeletionTaskStatus,
	FileSystemDeletionTask,
} from 'src/file-system/entities/file-system-deletion-task.model'
import { Op, Transaction } from 'sequelize'
import { InternalBusinessException } from 'src/exception/internal-business.exception'
import { ACEOutBoxActionService } from 'src/access-control/outbox-tasks/ace-outbox-action.service'
import { AceOutboxTaskDto } from 'src/access-control/dto/ace-outbox.dto'
import { AclResource } from 'src/access-control/constants/access-control.constants'

@Injectable()
export class DeletionTaskService {
	private readonly logger = new Logger(DeletionTaskService.name)

	constructor(
		@InjectModel(FileSystemDeletionTask)
		private readonly delitionTaskModel: typeof FileSystemDeletionTask,

		private readonly aceOutboxService: ACEOutBoxActionService
	) {}

	private taskErrorHandler(e: any) {
		const constraint = e.parent?.constraint

		if (constraint === 'ix_deletion_task_node_id') {
			throw new BadRequestException(
				'Элемент уже поставлен в очередь на удаление'
			)
		}

		if (
			e instanceof BadRequestException ||
			e instanceof InternalBusinessException ||
			e instanceof ConflictException ||
			e instanceof NotFoundException
		) {
			throw e
		}

		throw new InternalBusinessException('Что-то пошло не так')
	}

	/**
	 * Создать задачу на удаление
	 * @param nodeID - Узел
	 * @param ownerID - Владелец узла
	 * @param type - Тип задачи (SOFT_DELETE | PENDING)
	 * @param tx - Транзакция
	 */
	async create(
		nodeID: string,
		ownerID: string,
		type: DeletionTaskStatus,
		tx: Transaction
	) {
		const isTransaction = !!tx
		const transaction = isTransaction
			? tx
			: await this.delitionTaskModel.sequelize.transaction()

		try {
			const result = await this.delitionTaskModel.create(
				{
					nodeID: nodeID,
					ownerID: ownerID,
					status: type,
				},
				{ transaction }
			)

			if (!isTransaction) await transaction.commit()

			return result
		} catch (e) {
			if (!isTransaction) await transaction.rollback()

			this.logger.error(
				`Прин создании задачи, что-то пошло не так. Ошибка: ${e}`
			)

			this.taskErrorHandler(e)
		}
	}

	/**
	 * Удалить задачу на удаление
	 * @param nodeID - Узел
	 * @param ownerID - Владелец узла
	 * @param tx - Транзакция
	 */
	async restore(nodeID: string, ownerID: string, tx: Transaction) {
		const isTransaction = !!tx
		const transaction = isTransaction
			? tx
			: await this.delitionTaskModel.sequelize.transaction()

		try {
			const result = await this.delitionTaskModel.findOne({
				where: {
					ownerID: ownerID,
					nodeID: nodeID,
					status: DeletionTaskStatus.SOFT_DELETED,
				},
				transaction: transaction,
				lock: transaction.LOCK.UPDATE,
			})

			if (!result) {
				throw new BadRequestException(
					'Узел в списке задач на удаление не найден. (либо удалён, либо что-то не так)'
				)
			}

			result.destroy({ transaction: transaction })

			if (!isTransaction) await transaction.commit()

			return result
		} catch (e) {
			if (!isTransaction) await transaction.rollback()

			this.logger.error(
				`Прин восстановлении узла и удаление его задачи, что-то пошло не так. Ошибка: ${e}`
			)

			this.taskErrorHandler(e)
		}
	}

	/**
	 * Удалить задачу на удаление
	 * @param nodeID - Узел
	 * @param ownerID - Владелец узла
	 * @param tx - Транзакция
	 */
	async deleteExternal(limit: number, tx?: Transaction) {
		const isTransaction = !!tx
		const transaction = isTransaction
			? tx
			: await this.delitionTaskModel.sequelize.transaction()

		try {
			const tasks = await this.delitionTaskModel.findAll({
				where: {
					status: DeletionTaskStatus.DELETING_EXTERNAL,
				},
				limit: limit,
				lock: transaction.LOCK.UPDATE,
				skipLocked: true,
				transaction: transaction,
			})

			const taskIDs = tasks.map((e) => e.id)

			const dtos = tasks.map((e): AceOutboxTaskDto => {
				return {
					resourceID: e.nodeID,
					subjectID: null,
					aceTaskDataType: {
						spiceDB: {
							resource: {
								id: e.nodeID,
								type: AclResource.NODE,
							},
						},
					},
				}
			})

			let result

			//2
			if (dtos.length > 0) {
				const externalResult = await this.aceOutboxService.deleteResource(dtos)

				//3
				if (!externalResult) {
					throw new BadRequestException(`При отправке задачи произошла ошибка`)
				}

				result = await this.delitionTaskModel.update(
					{
						status: DeletionTaskStatus.PROCESSING_EXTERNAL,
					},
					{
						where: {
							id: {
								[Op.in]: taskIDs,
							},
						},
						transaction: transaction,
					}
				)
			}

			if (!isTransaction) await transaction.commit()

			return result
		} catch (e) {
			if (!isTransaction) await transaction.rollback()

			this.logger.error(
				`Прин восстановлении узла и удаление его задачи, что-то пошло не так. Ошибка: ${e}`
			)

			this.taskErrorHandler(e)
		}
	}
}
