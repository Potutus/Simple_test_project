import { Injectable, OnModuleInit, Logger } from '@nestjs/common'
import { QueryTypes } from 'sequelize'
import { FileSystemDeletionTask } from 'src/file-system/entities/file-system-deletion-task.model'
import { InjectModel } from '@nestjs/sequelize'
import { selectProcessingTaskQuery } from './sql-queries/select-processing-task.query'
import { deleteNodesAndUpdateQuotaQuery } from './sql-queries/delete-nodes-update-quota.query'
import { InternalBusinessException } from 'src/exception/internal-business.exception'
import { selectInsertNewTaskQuery } from './sql-queries/select-insert-new-task.query'
import { DeletionTaskService } from './deletion-action.service'

const maxSelectTaskLimit = 51
const maxBatchSizePerParentLimit = 101
const selectTaskLimit = 2
const batchSizePerParentLimit = 2

enum PickTaskType {
	PENDING = 'PENDING',
	PROCESSING = 'PROCESSING',
	DELETING = 'DELETING',
	DELETING_EXTERNAL = 'DELETING_EXTERNAL',
}

@Injectable()
export class DeletionWorkerService implements OnModuleInit {
	private readonly logger = new Logger(DeletionWorkerService.name)

	constructor(
		@InjectModel(FileSystemDeletionTask)
		private readonly delitionTaskModel: typeof FileSystemDeletionTask,

		private readonly deletionTaskService: DeletionTaskService
	) {}

	async onModuleInit() {
		this.logger.log('Запуск цикла внешнего обработчика...')
		this.startTasksWorkerLoop(PickTaskType.PENDING)
		this.startTasksWorkerLoop(PickTaskType.DELETING)
		this.startTasksWorkerLoop(PickTaskType.DELETING_EXTERNAL)
		this.startTasksWorkerLoop(PickTaskType.PROCESSING)
	}

	private async startTasksWorkerLoop(type: PickTaskType) {
		while (true) {
			try {
				const tasks = await this.pickTaskQuery(
					type,
					batchSizePerParentLimit,
					selectTaskLimit
				)

				await this.sleep(1200)

				continue
			} catch (e) {
				this.logger.error('Критическая ошибка цикла внешнего обработчика:', e)
				await this.sleep(20000)
			}
		}
	}

	private async pickTaskQuery(
		type: PickTaskType,
		batchLimit: number,
		taskBatchLimit: number
	) {
		if (
			batchLimit > maxBatchSizePerParentLimit ||
			taskBatchLimit > maxSelectTaskLimit
		) {
			return
		}

		let query: string

		try {
			switch (type) {
				case PickTaskType.PENDING:
					query = selectInsertNewTaskQuery()
					break
				case PickTaskType.DELETING:
					query = deleteNodesAndUpdateQuotaQuery()
					break
				case PickTaskType.DELETING_EXTERNAL:
					query = ''
					await this.deletionTaskService.deleteExternal(taskBatchLimit) //deleteNodesAndUpdateQuotaQuery()
					return
				case PickTaskType.PROCESSING:
					query = selectProcessingTaskQuery()
					break
				default:
					return
			}

			const queryParams = {
				batchSizePerParentLimit: batchLimit,
				selectTaskLimit: taskBatchLimit,
			}

			const tasks =
				await this.delitionTaskModel.sequelize.query<FileSystemDeletionTask>(
					query,
					{
						replacements: queryParams,
						type: QueryTypes.SELECT,
					}
				)

			return tasks
		} catch (e) {
			this.logger.error(`При обработке задач, что-то пошло не так: ${e}`)
			throw new InternalBusinessException(
				'При обработке задач, что-то пошло не так'
			)
		}
	}

	private async sleep(ms: number) {
		return new Promise((resolve) => setTimeout(resolve, ms))
	}
}
