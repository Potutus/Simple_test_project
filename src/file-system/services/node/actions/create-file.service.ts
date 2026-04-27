import { Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/sequelize'
import { uuidv7 } from 'uuidv7'
import { FileManagerService } from 'src/files/files-manager.service'
import {
	FilePurpose,
	OwnerType,
} from 'src/files/entities/file-attachment.model'
import { FileStorageType } from 'src/files/entities/file-storage.model'
import { FILES_CONFIG } from 'src/utils/const.config'
import { FsPermissionService } from 'src/file-system/services/access/fs-permission.service'
import { FsQuotaService } from 'src/file-system/services/access/fs-quota.service'
import {
	FSNodeType,
	FileSystemNode,
} from 'src/file-system/entities/file-system-node.model'
import { SortKeyService } from 'src/file-system/services/core/sort-key.service'
import { FSAction } from 'src/file-system/services/access/fs-node-policy-core.service'
import { FsAclManagerService } from '../../access/fs-acl-manager.service'
import { FsErrorHandler } from './handlers/action-error.handler'

@Injectable()
export class CreateFileService {
	constructor(
		@InjectModel(FileSystemNode)
		private readonly nodeModel: typeof FileSystemNode,

		private readonly permission: FsPermissionService,
		private readonly quota: FsQuotaService,
		private readonly fileManagerService: FileManagerService,
		private readonly aclManager: FsAclManagerService
	) {}

	/**
	 * Создание файла в ФС
	 * @param opts
	 * @returns
	 */
	async create(opts: {
		userID: string
		parentID?: string
		name: string
		file: Express.Multer.File
		metadata?: Record<string, any>
		mediaID?: string
		content?: string
	}) {
		const { userID, parentID, name, file, metadata, mediaID, content } = opts

		let parentNode: FileSystemNode

		const nodeMap = await this.permission.assertPermissionsBatch(userID, [
			{
				action: FSAction.CREATE_FILE,
				sourceID: null,
				targetParentID: parentID,
				opts: { onlyParentCheck: true },
			},
		])

		nodeMap.forEach((el) => (parentNode = el))

		const transaction = await this.nodeModel.sequelize.transaction()

		try {
			const createdFile = await this.fileManagerService.createFile(
				file,
				FileStorageType.LOCAL,
				transaction,
				{
					filterType: FILES_CONFIG.FS_NODE.TYPE,
					fileDirType: FILES_CONFIG.FS_NODE.TYPE,
				}
			)

			const sizeBytes = createdFile.fileStorage.size
			const mime = createdFile.fileStorage.mimeType

			await this.quota.checkAndAdjust(userID, BigInt(sizeBytes), transaction)

			const nodeID = uuidv7()
			const sortKey = SortKeyService.generateInitial()

			const node = await this.nodeModel.create(
				{
					id: nodeID,
					ownerID: userID,
					parentID: parentNode.id,
					nodeType: FSNodeType.FILE,
					name: name,
					description: null,
					sortKey: sortKey,
					sizeCache: BigInt(sizeBytes),
					mimeCache: mime ?? null,
					metadata: metadata ?? null,
					content: null,
					mediaID: mediaID ?? null,
				},
				{ transaction }
			)

			const attachedFile = await this.fileManagerService.attachFile(
				createdFile.tempFile,
				createdFile.fileStorage,
				OwnerType.FS_NODES,
				node.id,
				FilePurpose.ORIGINAL,
				createdFile.created,
				transaction
			)

			await this.aclManager.createNode(userID, nodeID, parentNode.id)

			await transaction.commit()

			if (attachedFile.fileStorage?.id && !attachedFile.existed) {
				await this.fileManagerService
					.finalizeFileStorage(createdFile.fileStorage.id)
					.catch((finalizeErr) => {
						console.error(
							`Ошибка финализации файла ${createdFile.fileStorage.id}:`,
							finalizeErr
						)
					})
			}

			return node
		} catch (e) {
			await transaction.rollback()

			FsErrorHandler(e)
		}
	}
}
