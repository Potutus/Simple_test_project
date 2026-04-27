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
import { FileSystemNode } from 'src/file-system/entities/file-system-node.model'
import { FsPermissionService } from '../../access/fs-permission.service'
import { FSMetadataService } from '../../core/fs-metadata.service'
import { FSAction } from '../../access/fs-node-policy-core.service'
import { FsAclManagerService } from '../../access/fs-acl-manager.service'
import { DeletionTaskService } from '../../deletion-tasks/deletion-action.service'
import * as crypto from 'crypto'
import { InternalBusinessException } from 'src/exception/internal-business.exception'

@Injectable()
export class RestoreService {
	private readonly logger = new Logger(RestoreService.name)

	constructor(
		@InjectModel(FileSystemNode)
		private readonly fsNodeModel: typeof FileSystemNode,

		private readonly permission: FsPermissionService,
		private readonly metadataService: FSMetadataService,
		private readonly aclManager: FsAclManagerService,
		private readonly deletionTaskService: DeletionTaskService
	) {}

	/**
	 * Восстановление узла
	 * @param opts
	 * @returns
	 */

	async restore(opts: {
		userID: string
		nodeID: string
		newParentID?: string
	}) {
		const { userID, nodeID, newParentID } = opts

		const nodeMap = await this.permission.assertPermissionsBatch(userID, [
			{
				action: FSAction.RESTORE,
				sourceID: nodeID,
			},
		])

		const node = nodeMap.get(nodeID)

		const parentID = newParentID ?? node.metadata?.trash?.oldPath
		let oldParentID: string

		if (parentID) {
			const nodeMap = await this.permission.assertPermissionsBatch(userID, [
				{
					action: FSAction.MOVE,
					sourceID: nodeID,
					targetParentID: parentID,
				},
			])

			const parent = nodeMap.get(nodeID)

			oldParentID = parent.id
		}

		const randHex = crypto.randomBytes(6).toString('hex')
		const oldName = `${node.metadata.trash.oldName}_${randHex}`
		const newMetadata = await this.metadataService.removeMetadataKey(
			node.metadata,
			'trash'
		)

		const transaction = await this.fsNodeModel.sequelize.transaction()

		try {
			await node.update(
				{
					name: oldName,
					parentID: parentID,
					deletedAt: null,
					metadata: newMetadata,
				},
				{
					transaction,
				}
			)

			await this.deletionTaskService.restore(node.id, node.ownerID, transaction)

			await this.aclManager.revokePermissions(
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

			await this.aclManager.changeParent(
				{
					userID: userID,
					nodeID: nodeID,
					oldParentID: oldParentID,
					newParentID: newParentID,
				},
				true
			)

			//await this.aclManager.

			await transaction.commit()

			return {
				restored: !node.deletedAt,
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
