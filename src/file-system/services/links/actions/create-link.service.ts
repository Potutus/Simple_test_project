import {
	Injectable,
	InternalServerErrorException,
	BadRequestException,
} from '@nestjs/common'
import { InjectModel } from '@nestjs/sequelize'
import { uuidv7 } from 'uuidv7'
import {
	FSLinkType,
	FSMetadataCategoryType,
	FSMetadataType,
	FSNodeType,
	FileSystemNode,
} from 'src/file-system/entities/file-system-node.model'
import { FsPermissionService } from '../../access/fs-permission.service'
import { FSAction } from '../../access/fs-node-policy-core.service'
import { SortKeyService } from '../../core/sort-key.service'
import { AssertTargetService } from './assert-target.service'
import { ResolveParentService } from '../../system-node/resolve-parent-folder.service'
import { FsAclManagerService } from '../../access/fs-acl-manager.service'

@Injectable()
export class CreateLinkService {
	constructor(
		@InjectModel(FileSystemNode)
		private readonly fsNodeModel: typeof FileSystemNode,

		private readonly permissions: FsPermissionService,
		private readonly assertTargetService: AssertTargetService,
		private readonly resolveParentService: ResolveParentService,
		private readonly aclManager: FsAclManagerService
	) {}

	async create(opts: {
		userID: string
		parentID?: string
		name: string
		targetType: FSLinkType
		targetID: string
	}) {
		const { userID, parentID, name, targetType, targetID } = opts

		const target = await this.assertTargetService.assert(
			userID,
			targetType,
			targetID,
			true
		)

		const resolvedParentID = await this.resolveParentService.resolve(
			userID,
			parentID,
			target.systemDomain
		)

		const nodeMap = await this.permissions.assertPermissionsBatch(userID, [
			{
				action: FSAction.CREATE_LINK,
				sourceID: resolvedParentID,
			},
		])

		const parent = nodeMap.get(resolvedParentID)

		// if (parent.nodeType !== FSNodeType.FOLDER) {
		// 	throw new BadRequestException('Узел назначения должен быть папкой')
		// }

		// где то здесь надо вести проверку на попытку запихнуть ссылку с несоответствующим domain в наш альбом или избранное
		// вообщем если есть хочешь видео в избранное аудио запихнуть, и проверка на допустимость взаимодействий в системной папке

		// Создаём ссылку
		const nodeID = uuidv7()
		const sortKey = SortKeyService.generateInitial()

		const targetCategory =
			parent.systemDomain || parent.systemTag
				? target.systemDomain
				: FSMetadataCategoryType.NOT_SYSTEM

		const newMetadata: FSMetadataType = {
			link: {
				category: targetCategory ?? FSMetadataCategoryType.NOT_SYSTEM,
				type: targetType,
				id: targetID,
			},
		}

		const transaction = await this.fsNodeModel.sequelize.transaction()

		try {
			const linkNode = await this.fsNodeModel.create(
				{
					id: nodeID,
					ownerID: userID,
					parentID: resolvedParentID,
					nodeType: FSNodeType.FILE,
					isLink: true,
					isInherit: false,
					name: name ?? target.name,
					description: target.description,
					sortKey: sortKey,
					sizeCache: BigInt(0),
					mimeCache: null,
					metadata: newMetadata,
				},
				{ transaction }
			)

			await this.aclManager.createNode(userID, nodeID, resolvedParentID)

			await transaction.commit()

			return linkNode
		} catch (e) {
			await transaction.rollback()

			const constraint = e.parent?.constraint

			if (
				constraint === 'ix_fs_unique_name_children' ||
				constraint === 'ix_fs_unique_name_root'
			) {
				throw new BadRequestException(
					'У вас уже есть папка/файл с таким названием в папке назначения'
				)
			}

			throw new InternalServerErrorException('Что-то пошло не так')
		}
	}
}
