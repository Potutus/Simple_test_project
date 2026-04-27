import { Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/sequelize'

import { FsAclManagerService } from '../access/fs-acl-manager.service'
import { FileSystemNode } from '../../entities/file-system-node.model'
import { FSNodeTag } from '../../entities/file-system-node-tag.model'
import { FsPermissionService } from '../access/fs-permission.service'
import { FSAction } from '../access/fs-node-policy-core.service'

@Injectable()
export class TagQueryService {
	constructor(
		@InjectModel(FileSystemNode)
		private readonly nodeModel: typeof FileSystemNode,

		@InjectModel(FSNodeTag)
		private readonly nodeTagModel: typeof FSNodeTag,

		private readonly acl: FsAclManagerService,
		private readonly permission: FsPermissionService
	) {}

	async findNodesByTag(userID: string, tagID: string) {
		// Мы фильтруем только ноды владельца userID
		// ACL: пользователь может видеть только свои файлы (или доступные)

		const nodes = await this.nodeModel.findAll({
			include: [
				{
					model: FSNodeTag,
					where: { tagID },
				},
			],
			where: {
				ownerID: userID,
			},
			order: [['sortKey', 'ASC']],
		})

		// фильтр ACL (если будут шэринг)
		const filtered = []
		for (const n of nodes) {
			if (
				await this.permission.assertPermissionsBatch(userID, [
					{
						action: FSAction.READ,
						sourceID: n.id,
					},
				])
			) {
				filtered.push(n)
			}
		}

		return filtered
	}
}
