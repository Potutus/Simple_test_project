import { Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/sequelize'
import { uuidv7 } from 'uuidv7'
import { FsPermissionService } from 'src/file-system/services/access/fs-permission.service'
import {
	FSNodeType,
	FileSystemNode,
} from 'src/file-system/entities/file-system-node.model'
import { SortKeyService } from 'src/file-system/services/core/sort-key.service'
import { FSAction } from 'src/file-system/services/access/fs-node-policy-core.service'
import { FsAclManagerService } from '../../access/fs-acl-manager.service'
import { FsErrorHandler } from './handlers/action-error.handler'

@Injectable()
export class CreateFolderService {
	constructor(
		@InjectModel(FileSystemNode)
		private readonly nodeModel: typeof FileSystemNode,

		private readonly permission: FsPermissionService,
		private readonly aclManager: FsAclManagerService
	) {}

	/**
	 * Создание папки в ФС
	 * @param opts
	 * @returns
	 */
	async create(opts: {
		userID: string
		parentID: string
		name: string
		description?: string
		metadata?: Record<string, any>
	}) {
		const { userID, parentID, name, description, metadata } = opts

		let parentNode: FileSystemNode

		const nodeMap = await this.permission.assertPermissionsBatch(userID, [
			{
				action: FSAction.CREATE_FOLDER,
				sourceID: null,
				targetParentID: parentID,
				opts: { onlyParentCheck: true },
			},
		])

		nodeMap.forEach((el) => (parentNode = el))

		const nodeID = uuidv7()
		const sortKey = SortKeyService.generateInitial()

		const transaction = await this.nodeModel.sequelize.transaction()

		try {
			const node = await this.nodeModel.create(
				{
					id: nodeID,
					ownerID: userID,
					parentID: parentNode?.id,
					nodeType: FSNodeType.FOLDER,
					name: name,
					description: description ?? null,
					sortKey: sortKey,
					sizeCache: BigInt(0),
					mimeCache: null,
					metadata: metadata ?? null,
					content: null,
				},
				{ transaction }
			)

			await this.aclManager.createNode(userID, nodeID, parentNode.id)

			transaction.commit()

			return node
		} catch (e) {
			transaction.rollback()

			FsErrorHandler(e)
		}
	}
}
