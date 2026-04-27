import {
	Injectable,
	forwardRef,
	Inject,
	OnModuleInit,
	Logger,
} from '@nestjs/common'
import { QueryTypes } from 'sequelize'
import { FileSystemDeletionTask } from 'src/file-system/entities/file-system-deletion-task.model'
import { InjectModel } from '@nestjs/sequelize'
import { InternalBusinessException } from 'src/exception/internal-business.exception'
import { AccessControlEntry } from '../entities/acl.model'
import { ACEOutboxTask } from '../entities/acl-outbox-task.model'
import { ACEOutBoxService } from './ace-outbox.service'

const maxSelectTaskLimit = 51
const maxBatchSizePerParentLimit = 101
const selectTaskLimit = 2
const batchSizePerParentLimit = 2

enum PickTaskScope {
	RESOURCE = 'RESOURCE',
	RELATION = 'RELATION',
}

enum PickTaskType {
	PENDING = 'PENDING',
	PROCESSING = 'PROCESSING',
	DELETING = 'DELETING',
}

@Injectable()
export class OutboxWorkerService implements OnModuleInit {
	private readonly logger = new Logger(OutboxWorkerService.name)
	constructor(
		@InjectModel(ACEOutboxTask)
		private readonly aceOutboxTaskModel: typeof ACEOutboxTask,

		private readonly aceOutBoxService: ACEOutBoxService
	) {}
	async onModuleInit() {
		this.logger.log('Запуск цикла внешнего обработчика...')
		this.logger.debug(`PROOOOOOOOOOOOOOOOOJ`)
		this.startTasksWorkerLoop(PickTaskType.PENDING)
		this.startTasksWorkerLoop(PickTaskType.PROCESSING)
		//this.startTasksWorkerLoop(PickTaskType.DELETING)
		//this.startTasksWorkerLoop(PickTaskType.PROCESSING)
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

		this.logger.debug(`PROOOOOOOOOOOOOOOOOJ`)

		try {
			switch (type) {
				case PickTaskType.PENDING:
					query = '' //selectInsertNewTaskQuery()
					await this.aceOutBoxService.processDeleteTasks(
						taskBatchLimit,
						batchLimit
					)
					return
				case PickTaskType.DELETING:
					query = '' //deleteNodesAndUpdateQuotaQuery()
					await this.aceOutBoxService.proceedACEProcessingTasks(taskBatchLimit)
					return
				case PickTaskType.PROCESSING:
					query = '' //selectProcessingTaskQuery()
					return
				default:
					return
			}

			const queryParams = {
				batchSizePerParentLimit: batchLimit,
				selectTaskLimit: taskBatchLimit,
			}
			const tasks = await this.aceOutboxTaskModel.sequelize.query(query, {
				replacements: queryParams,
				type: QueryTypes.SELECT,
			})

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
