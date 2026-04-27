import { Injectable } from '@nestjs/common'
import { LinkService } from 'src/file-system/services/links/link.service'
import { TrashService } from 'src/file-system/services/trash/trash.service'
import { FSLinkType } from 'src/file-system/entities/file-system-node.model'
import { NodeService } from './services/node/node.service'

@Injectable()
export class FileSystemService {
	constructor(
		private readonly linkService: LinkService,
		private readonly trashService: TrashService,
		private readonly nodeService: NodeService
	) {}

	async createFolder(opts: {
		userID: string
		parentID: string
		name: string
		description?: string
		metadata?: Record<string, any>
	}) {
		return await this.nodeService.createFolder(opts)
	}

	async createFile(opts: {
		userID: string
		parentID?: string
		name: string
		file: Express.Multer.File
		metadata?: Record<string, any>
		mediaID?: string
		content?: string
	}) {
		return await this.nodeService.createFile(opts)
	}

	async createLink(opts: {
		userID: string
		parentID: string
		name: string
		targetType: FSLinkType
		targetID: string
	}) {
		return await this.linkService.create(opts)
	}

	async getOne(actorID: string, nodeID: string) {
		return await this.nodeService.getOne(actorID, nodeID)
	}

	async getChildren(opts: {
		actorID: string
		parentID: string
		limit?: number
		afterSortKey?: string | null
		order?: 'ASC' | 'DESC'
		userID: string
	}) {
		return await this.nodeService.getChildren(opts)
	}

	async update(opts: {
		userID: string
		nodeID: string
		name: string
		description: string
		sortKey: string
		content: string
		isInherit: boolean
	}) {
		return await this.nodeService.update(opts)
	}

	async move(opts: { userID: string; nodeID: string; newParentID: string }) {
		return await this.nodeService.move(opts)
	}

	// --------------------------
	// // Update metadata (merge or replace)
	// // --------------------------
	// async replaceMetadata(opts: {
	// 	userID: string
	// 	nodeID: string
	// 	newMeta: Record<string, any>
	// }) {
	// 	const { userID, nodeID, newMeta } = opts

	// 	const node = await await this.permission.assertPermission(
	// 		userID,
	// 		nodeID,
	// 		AclPermission.EDIT,
	// 		FSAction.UPDATE
	// 	)

	// 	if (!node) {
	// 		throw new NotFoundException('Node not found')
	// 	}

	// 	return await this.metadata.replaceMetadataAndSave(node, newMeta)
	// }

	// async mergeMetadata(opts: {
	// 	userID: string
	// 	nodeID: string
	// 	patch: Record<string, any>
	// }) {
	// 	const { userID, nodeID, patch } = opts

	// 	const node = await this.permission.assertPermission(
	// 		userID,
	// 		nodeID,
	// 		AclPermission.EDIT,
	// 		FSAction.UPDATE
	// 	)

	// 	if (!node) {
	// 		throw new NotFoundException('Node not found')
	// 	}

	// 	return this.metadata.mergeMetadataAndSave(node, patch)
	// }

	// --------------------------
	// Tags: attach/detach/list
	// --------------------------
	// async attachTag(userID: string, nodeID: string, tagID: string) {
	// 	return this.nodeTag.attachTag(userID, nodeID, tagID)
	// }

	// async detachTag(userID: string, nodeID: string, tagID: string) {
	// 	return this.nodeTag.detachTag(userID, nodeID, tagID)
	// }

	// async getTagsForNode(userID: string, nodeID: string) {
	// 	return this.nodeTag.getTagsForNode(nodeID, userID)
	// }

	// --------------------------
	// Trash operations (soft delete / restore / purge)
	// --------------------------
	async softDelete(userID: string, nodeID: string) {
		return this.trashService.softDelete({ userID, nodeID })
	}

	async restore(userID: string, nodeID: string) {
		return this.trashService.restore({ userID, nodeID })
	}

	async purge(userID: string, nodeID: string) {
		return this.trashService.purge({ userID, nodeID })
	}
}
