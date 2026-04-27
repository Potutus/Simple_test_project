import {
	BadRequestException,
	Injectable,
	Logger,
	NotFoundException,
} from '@nestjs/common'
import { InjectModel } from '@nestjs/sequelize'
import { FileSystemNode } from 'src/file-system/entities/file-system-node.model'
import { FsPermissionService } from '../../access/fs-permission.service'
import { FSAction } from '../../access/fs-node-policy-core.service'
import { DeletionTaskService } from '../../deletion-tasks/deletion-action.service'
import { DeletionTaskStatus } from 'src/file-system/entities/file-system-deletion-task.model'
import { InternalBusinessException } from 'src/exception/internal-business.exception'

@Injectable()
export class PurgeService {
	private readonly logger = new Logger(PurgeService.name)

	constructor(
		@InjectModel(FileSystemNode)
		private readonly fsNodeModel: typeof FileSystemNode,

		private readonly permission: FsPermissionService,
		private readonly deletionTaskService: DeletionTaskService
	) {}

	/**
	 * Полное удланеи узла
	 * @param opts
	 * @returns
	 */

	async purge(opts: { userID: string; nodeID: string }) {
		const { userID, nodeID } = opts

		const nodeMap = await this.permission.assertPermissionsBatch(userID, [
			{
				action: FSAction.HARD_DELETE,
				sourceID: nodeID,
			},
		])

		const node = nodeMap.get(nodeID)

		const transaction = await this.fsNodeModel.sequelize.transaction()

		try {
			await this.deletionTaskService.create(
				node.id,
				node.ownerID,
				DeletionTaskStatus.PENDING,
				transaction
			)

			await transaction.commit()

			return { deleted: true }
		} catch (e) {
			await transaction.rollback()

			if (
				e instanceof BadRequestException ||
				e instanceof InternalBusinessException ||
				e instanceof NotFoundException
			) {
				throw e
			}

			throw new InternalBusinessException('Что-то пошло не так')
		}
	}
}
