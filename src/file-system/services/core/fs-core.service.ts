import { Injectable, NotFoundException } from '@nestjs/common'
import { InjectModel } from '@nestjs/sequelize'
import {
	FSNodeType,
	FileSystemNode,
} from '../../entities/file-system-node.model'

@Injectable()
export class FSCoreService {
	constructor(
		@InjectModel(FileSystemNode)
		private readonly nodeModel: typeof FileSystemNode
	) {}

	/** Найти ноду, кинуть 404 если нет */
	async getNodeOrFail(nodeID: string, ownerID: string) {
		const node = await this.nodeModel.findOne({
			where: {
				id: nodeID,
				ownerID: ownerID,
			},
		})
		if (!node) throw new NotFoundException('Узел не найдена')
		return node
	}

	/** Создать ноду (без path и sortKey — их добавляет FSPathService) */
	async createNode(data: {
		ownerID: string
		parentID: string
		nodeType: FSNodeType
		name: string
		description?: string
		mimeCache?: string
		sizeCache?: bigint
		metadata?: Record<string, any>
		content?: string
		mediaID?: string
	}) {
		const node = await this.nodeModel.create({
			...data,
		})
		return node
	}

	//обновление метадаты должно быть через другое поле (+ надо определять добавить ли новое поле или заменить в принципе)

	/** Обновление: только базовые поля */
	async updateNode(
		node: FileSystemNode,
		data: Partial<{
			name: string
			description: string
			metadata: any
			content: string | null
			//mimeCache: string
			//sizeCache: number
		}>
	) {
		Object.assign(node, data)
		await node.save()
		return node
	}

	// дополнить удаление переносмо в новый путь root.trash (trash системная папка, если её нет, то сделать)

	/** Soft-delete */
	async moveToTrash(node: FileSystemNode) {
		node.deletedAt = new Date()
		await node.save()
	}

	/** Restore */
	async restoreFromTrash(node: FileSystemNode) {
		node.deletedAt = null
		await node.save()
	}

	/** Hard delete */
	async removeNode(node: FileSystemNode) {
		await node.destroy()
	}
}
