import { Injectable, ForbiddenException } from '@nestjs/common'
import { InjectModel } from '@nestjs/sequelize'
import { FsAclManagerService } from '../access/fs-acl-manager.service'
import { FSNodeTag } from '../../entities/file-system-node-tag.model'
import { FSTags } from '../../entities/file-system-tag.model'
import { FileSystemNode } from '../../entities/file-system-node.model'
import { FsPermissionService } from '../access/fs-permission.service'
import { FSAction } from '../access/fs-node-policy-core.service'

@Injectable()
export class FSNodeTagService {
	constructor(
		@InjectModel(FSNodeTag)
		private readonly nodeTagModel: typeof FSNodeTag,

		@InjectModel(FSTags)
		private readonly tagModel: typeof FSTags,

		@InjectModel(FileSystemNode)
		private readonly nodeModel: typeof FileSystemNode,

		private readonly acl: FsAclManagerService,
		private readonly permission: FsPermissionService
	) {}

	// -------------------------------------------------------------
	// ATTACH
	// -------------------------------------------------------------

	async attachTag(userID: string, nodeID: string, tagID: string) {
		// ACL: user must have write access to node

		const nodeMap = await this.permission.assertPermissionsBatch(userID, [
			{
				action: FSAction.UPDATE,
				sourceID: nodeID,
			},
		])

		const node = nodeMap.get(nodeID)

		const tag = await this.tagModel.findByPk(tagID)
		if (!tag || tag.ownerID !== userID) {
			throw new ForbiddenException('Отказано в доступе')
		}

		await this.nodeTagModel.findOrCreate({
			where: { nodeID, tagID },
		})

		return { attached: true }
	}

	// -------------------------------------------------------------
	// DETACH
	// -------------------------------------------------------------

	async detachTag(userID: string, nodeID: string, tagID: string) {
		const nodeMap = await this.permission.assertPermissionsBatch(userID, [
			{
				action: FSAction.UPDATE,
				sourceID: nodeID,
			},
		])

		const node = nodeMap.get(nodeID)

		await this.nodeTagModel.destroy({
			where: { nodeID, tagID },
		})

		return { detached: true }
	}

	// -------------------------------------------------------------
	// REPLACE ALL
	// -------------------------------------------------------------

	async setTags(userID: string, nodeID: string, tagIDs: string[]) {
		const nodeMap = await this.permission.assertPermissionsBatch(userID, [
			{
				action: FSAction.UPDATE,
				sourceID: nodeID,
			},
		])

		const node = nodeMap.get(nodeID)

		const tx = await this.nodeModel.sequelize.transaction()
		try {
			// удалить старые
			await this.nodeTagModel.destroy({
				where: { nodeID },
				transaction: tx,
			})

			// добавить новые
			for (const tagID of tagIDs) {
				await this.nodeTagModel.create({ nodeID, tagID }, { transaction: tx })
			}

			await tx.commit()
			return { count: tagIDs.length }
		} catch (err) {
			await tx.rollback()
			throw err
		}
	}

	// -------------------------------------------------------------
	// GET TAGS OF NODE
	// -------------------------------------------------------------

	async getTagsForNode(nodeID: string, userID: string) {
		const nodeMap = await this.permission.assertPermissionsBatch(userID, [
			{
				action: FSAction.READ,
				sourceID: nodeID,
			},
		])

		const node = nodeMap.get(nodeID)

		return this.tagModel.findAll({
			include: [
				{
					model: FSNodeTag,
					where: { nodeID },
				},
			],
			order: [['name', 'ASC']],
		})
	}
}
