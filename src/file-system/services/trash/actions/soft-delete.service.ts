import {
	Injectable,
	Logger,
	InternalServerErrorException,
	BadRequestException,
	NotFoundException,
} from '@nestjs/common'
import { InjectModel } from '@nestjs/sequelize'
import {
	AclRelation,
	AclResource,
} from 'src/access-control/constants/access-control.constants'
import {
	FSMetadataType,
	FSSystemDomain,
	FSSystemTag,
	FileSystemNode,
} from 'src/file-system/entities/file-system-node.model'
import { FsPermissionService } from '../../access/fs-permission.service'
import { SystemFolderService } from '../../system-node/system-node.service'
import { FSMetadataService } from '../../core/fs-metadata.service'
import { FSAction } from '../../access/fs-node-policy-core.service'
import { FsAclManagerService } from '../../access/fs-acl-manager.service'
import { v4 as uuidv4 } from 'uuid'
import { DeletionTaskStatus } from 'src/file-system/entities/file-system-deletion-task.model'
import { DeletionTaskService } from '../../deletion-tasks/deletion-action.service'
import { InternalBusinessException } from 'src/exception/internal-business.exception'

@Injectable()
export class SoftDeleteService {
	private readonly logger = new Logger(SoftDeleteService.name)

	constructor(
		@InjectModel(FileSystemNode)
		private readonly fsNodeModel: typeof FileSystemNode,

		private readonly permission: FsPermissionService,
		private readonly systemFolders: SystemFolderService,
		private readonly metadataService: FSMetadataService,
		private readonly aclManager: FsAclManagerService,
		private readonly deletionTaskService: DeletionTaskService
	) {}

	/**
	 * Мягкое удаление
	 * @param opts
	 * @returns
	 */
	async delete(opts: { userID: string; nodeID: string }) {
		const { userID, nodeID } = opts

		const nodeMap = await this.permission.assertPermissionsBatch(userID, [
			{
				action: FSAction.DELETE,
				sourceID: nodeID,
				opts: {
					softDelete: true,
				},
			},
		])

		const node = nodeMap.get(nodeID)

		// ACL: need DELETE

		// Возможно надо будет пересмотреть, так как у ссылки все-же можно открыть доступ
		if (node.isLink) {
			await node.destroy()

			return {
				moved: true,
				isLink: node.isLink,
			}
		}

		const trashID = await this.systemFolders.ensure(
			userID,
			FSSystemTag.TRASH,
			FSSystemDomain.ROOT
		)

		const newName = uuidv4()
		const patchMetadata: FSMetadataType = {
			trash: {
				oldPath: node.parentID,
				oldName: node.name,
			},
		}

		const newMetadata = await this.metadataService.mergeMetadata(
			node.metadata,
			patchMetadata
		)

		const transaction = await this.fsNodeModel.sequelize.transaction()

		try {
			//при уникальных именах он будет ломатся, так-что имена тоже надо изменять и запоминать их старые имена
			await node.update(
				{
					name: newName,
					parentID: trashID,
					deletedAt: new Date(),
					metadata: newMetadata,
				},
				{
					transaction,
				}
			)

			await this.deletionTaskService.create(
				node.id,
				node.ownerID,
				DeletionTaskStatus.SOFT_DELETED,
				transaction
			)

			//сделать задачи для ACE и подобное должно отправлятся туда
			await this.aclManager.grantPermissions(
				userID,
				[
					{
						resourceType: AclResource.NODE,
						resourceID: node.id,
						relation: AclRelation.IS_TRASHED,
						subjectType: AclResource.USER,
						subjectID: '*',
					},
				],
				true
			)

			await transaction.commit()

			return {
				moved: !!node.deletedAt,
				isLink: node.isLink,
			}
		} catch (e) {
			await transaction.rollback()

			if (
				e instanceof BadRequestException ||
				e instanceof InternalBusinessException ||
				e instanceof NotFoundException
			) {
				throw e
			}

			throw new InternalServerErrorException('Что-то пошло не так')
		}
	}
}
