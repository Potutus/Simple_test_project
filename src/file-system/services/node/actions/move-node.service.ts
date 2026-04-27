import { Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/sequelize'
import { FsPermissionService } from 'src/file-system/services/access/fs-permission.service'
import { FileSystemNode } from 'src/file-system/entities/file-system-node.model'
import { FSAction } from 'src/file-system/services/access/fs-node-policy-core.service'
import { FsAclManagerService } from '../../access/fs-acl-manager.service'
import { FsErrorHandler } from './handlers/action-error.handler'

@Injectable()
export class MoveNodeService {
	constructor(
		@InjectModel(FileSystemNode)
		private readonly nodeModel: typeof FileSystemNode,

		private readonly permission: FsPermissionService,
		private readonly aclManager: FsAclManagerService
	) {}

	/**
	 * Функция для перемещения узла
	 * @param opts
	 * @returns
	 */
	async move(opts: { userID: string; nodeID: string; newParentID: string }) {
		const { userID, nodeID, newParentID } = opts

		const nodeMap = await this.permission.assertPermissionsBatch(userID, [
			{
				action: FSAction.MOVE,
				sourceID: nodeID,
				targetParentID: newParentID,
			},
		])

		const node = nodeMap.get(nodeID)
		//const newParent = nodeMap.get(newParentID)!

		const transaction = await this.nodeModel.sequelize.transaction()

		try {
			const oldParentID = node.parentID

			node.parentID = newParentID

			await node.save({ transaction })

			await this.aclManager.changeParent(
				{
					userID: userID,
					nodeID: nodeID,
					oldParentID: oldParentID,
					newParentID: newParentID,
				},
				true
			)

			await transaction.commit()

			return node
		} catch (e) {
			await transaction.rollback()

			FsErrorHandler(e)
		}
	}
}
