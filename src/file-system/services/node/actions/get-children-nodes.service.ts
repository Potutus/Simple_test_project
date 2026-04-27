import { Injectable } from '@nestjs/common'
import { FsPermissionService } from 'src/file-system/services/access/fs-permission.service'
import { FSAction } from 'src/file-system/services/access/fs-node-policy-core.service'
import { FileSystemNode } from 'src/file-system/entities/file-system-node.model'
import { InjectModel } from '@nestjs/sequelize'

@Injectable()
export class GetChildrenNodesService {
	constructor(
		@InjectModel(FileSystemNode)
		private readonly nodeModel: typeof FileSystemNode,

		private readonly permission: FsPermissionService
	) {}

	/**
	 * Функция для получние дочерних элементов узла ФС
	 * @returns
	 */
	async get(opts: {
		actorID: string
		parentID: string
		limit?: number
		afterSortKey?: string | null
		order?: 'ASC' | 'DESC'
		userID: string
	}) {
		const {
			actorID,
			parentID,
			limit = 50,
			afterSortKey = null,
			order = 'ASC',
			userID,
		} = opts

		const nodeMap = await this.permission.assertPermissionsBatch(actorID, [
			{
				action: FSAction.READ,
				sourceID: parentID,
			},
		])

		const node = nodeMap.get(parentID)

		const rows = await this.nodeModel.findAll({
			where: {
				parentID: parentID,
				ownerID: userID,
			},
			limit,
		})

		return rows
	}
}
