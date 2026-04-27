import { Injectable } from '@nestjs/common'
import { CreateFolderService } from './actions/create-folder.service'
import { CreateFileService } from './actions/create-file.service'
import { GetNodeService } from './actions/get-node.service'
import { GetChildrenNodesService } from './actions/get-children-nodes.service'
import { UpdateNodeService } from './actions/update-node.service'
import { MoveNodeService } from './actions/move-node.service'

@Injectable()
export class NodeService {
	constructor(
		private readonly createFolderService: CreateFolderService,
		private readonly createFileService: CreateFileService,
		private readonly getNodeService: GetNodeService,
		private readonly getChildrenNodesService: GetChildrenNodesService,
		private readonly updateNodeService: UpdateNodeService,
		private readonly moveNodeService: MoveNodeService
	) {}

	async createFolder(opts: {
		userID: string
		parentID: string
		name: string
		description?: string
		metadata?: Record<string, any>
	}) {
		return await this.createFolderService.create(opts)
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
		return await this.createFileService.create(opts)
	}

	async getOne(actorID: string, nodeID: string) {
		return await this.getNodeService.get(actorID, nodeID)
	}

	async getChildren(opts: {
		actorID: string
		parentID: string
		limit?: number
		afterSortKey?: string | null
		order?: 'ASC' | 'DESC'
		userID: string
	}) {
		return await this.getChildrenNodesService.get(opts)
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
		return await this.updateNodeService.update(opts)
	}

	async move(opts: { userID: string; nodeID: string; newParentID: string }) {
		return await this.moveNodeService.move(opts)
	}
}
