import { Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/sequelize'
import { FsPermissionService } from 'src/file-system/services/access/fs-permission.service'
import { FileSystemNode } from 'src/file-system/entities/file-system-node.model'
import { FSAction } from 'src/file-system/services/access/fs-node-policy-core.service'
import { FsAclManagerService } from '../../access/fs-acl-manager.service'
import { FsErrorHandler } from './handlers/action-error.handler'

@Injectable()
export class UpdateNodeService {
	constructor(
		@InjectModel(FileSystemNode)
		private readonly nodeModel: typeof FileSystemNode,

		private readonly permission: FsPermissionService,
		private readonly aclManager: FsAclManagerService
	) {}

	/**
	 * Обновление данных узла
	 * @param opts
	 * @returns
	 */
	async update(opts: {
		userID: string
		nodeID: string
		name: string
		description: string
		sortKey: string
		content: string
		isInherit: boolean
	}) {
		const { userID, nodeID, name, description, sortKey, content, isInherit } =
			opts

		const nodeMap = await this.permission.assertPermissionsBatch(userID, [
			{
				action: FSAction.UPDATE,
				sourceID: nodeID,
			},
		])

		const node = nodeMap.get(nodeID)

		const transaction = await this.nodeModel.sequelize.transaction()

		try {
			await node.update(
				{
					name: name,
					description: description,
					sortKey: sortKey,
					content: content,
					isInherit: isInherit,
				},
				{ transaction }
			)

			await this.aclManager.switchInheritPermission(userID, node.id, isInherit)

			await transaction.commit()

			return node
		} catch (e) {
			await transaction.rollback()

			FsErrorHandler(e)
		}
	}
}
