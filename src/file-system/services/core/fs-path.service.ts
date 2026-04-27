// import { Injectable, BadRequestException } from '@nestjs/common'
// import { InjectModel } from '@nestjs/sequelize'

// import { Sequelize, Op } from 'sequelize'
// import { FileSystemNode } from '../entities/file-system-node.model'

// @Injectable()
// export class FSPathService {
// 	constructor(
// 		@InjectModel(FileSystemNode)
// 		private readonly nodeModel: typeof FileSystemNode
// 	) {}

// 	/** Генерация пути: parent.path + '.' + childID */
// 	buildPath(parentPath: string | null, nodeID: string) {
// 		if (!parentPath) return nodeID
// 		return `${parentPath}.${nodeID}`
// 	}

// 	/** Обновить путь ноды + всех детей */
// 	async updateSubtreePaths(
// 		node: FileSystemNode,
// 		newParentPath: string,
// 		t: any
// 	) {
// 		const oldPath = node.path
// 		const newPath = this.buildPath(newParentPath, node.id)

// 		// обновляем саму ноду
// 		node.path = newPath
// 		await node.save({ transaction: t })

// 		// обновляем всех детей
// 		const descendants = await this.nodeModel.findAll({
// 			where: {
// 				path: { [Op.startsWith]: oldPath },
// 			},
// 			transaction: t,
// 		})

// 		for (const child of descendants) {
// 			const suffix = child.path.slice(oldPath.length)
// 			child.path = newPath + suffix
// 			await child.save({ transaction: t })
// 		}
// 	}

// 	/** Проверка, что target не является потомком source */
// 	ensureMoveSafe(parent: FileSystemNode, target: FileSystemNode) {
// 		if (target.path.startsWith(parent.path)) {
// 			throw new BadRequestException('Cannot move folder into its own subtree')
// 		}
// 	}

// 	/** Получить детей ноды */
// 	async getChildren(nodeID: string, ownerID: string) {
// 		return this.nodeModel.findAll({
// 			where: { parentID: nodeID, ownerID },
// 			order: [['sortKey', 'ASC']],
// 		})
// 	}
// }
