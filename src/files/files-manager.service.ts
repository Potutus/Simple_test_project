import {
	Injectable,
	NotFoundException,
	InternalServerErrorException,
} from '@nestjs/common'
import { InjectModel } from '@nestjs/sequelize'
import {
	FileStorage,
	FileStorageType,
	FileLifeCycle,
	FileVirusScan,
} from './entities/file-storage.model'
import {
	FileAttachment,
	FilePurpose,
	OwnerType,
} from './entities/file-attachment.model'
import { FilesService } from './files.service'
import { Transaction } from 'sequelize'
import type { File_Data } from 'src/utils/types/file-data.type'
import { FILES_CONFIG, FILES_CONFIG_DIR } from 'src/utils/const.config'
import { InternalBusinessException } from 'src/exception/internal-business.exception'
import { FilesFilterType } from 'src/utils/types/config/const.type'

@Injectable()
export class FileManagerService {
	constructor(
		@InjectModel(FileStorage)
		private readonly fileStorageModel: typeof FileStorage,
		@InjectModel(FileAttachment)
		private readonly fileAttachmentModel: typeof FileAttachment,
		private readonly filesService: FilesService
	) {}

	async ingestTempFile(
		temp: File_Data,
		transaction: Transaction,
		opts: {
			storageType?: FileStorageType
			incrementRef?: boolean
			isTemporary?: boolean
		} = {}
	) {
		try {
			// данный момент проверки по хешу будет еще дорабатываться, так как будет многоуровневая проверка
			let fileStorage = await this.fileStorageModel.findOne({
				where: { hash: temp?.fileHash },
				transaction,
				lock: transaction.LOCK.UPDATE,
			})

			if (fileStorage) {
				if (opts.incrementRef)
					await fileStorage.increment('refCount', { by: 1, transaction })
				await fileStorage.update({ updatedAt: new Date() }, { transaction })
				return { fileStorage, created: false }
			}

			fileStorage = await this.fileStorageModel.create(
				{
					name: temp.fileName,
					mimeType: temp.fileMimeType,
					type: temp.fileCategory,
					size: temp.fileSize,
					hash: temp.fileHash,
					storageType: opts.storageType,
					storagePath: temp.fileDBPath,
					isTemporary: opts.isTemporary ?? true,
					metadata: temp.metadata || null,
				},
				{ transaction }
			)

			return { fileStorage, created: true }
		} catch (e) {
			return
		}
	}

	async finalizeFileStorage(fileID: string): Promise<FileStorage> {
		const transaction = await this.fileStorageModel.sequelize.transaction()
		try {
			const file = await this.fileStorageModel.findByPk(fileID, {
				transaction,
				lock: transaction.LOCK.UPDATE,
			})
			if (!file) {
				throw new NotFoundException('Файл не найден')
			}

			if (file.virusScan === FileVirusScan.FLAGGED) {
				throw new InternalBusinessException(
					'Файл был отмечен антивирусом как вредоносный'
				)
			}

			if (file.storageType === FileStorageType.LOCAL) {
				const tmpPath = this.filesService.tmpPathFor(file.name)
				await this.filesService.finalizeFile(tmpPath, file.storagePath)
				await file.update(
					{
						isTemporary: false,
						updatedAt: new Date(),
						lifecycle: FileLifeCycle.READY,
					},
					{ transaction }
				)
			} else {
				// при привязывании ceph надо будет доработать

				await file.update(
					{
						isTemporary: false,
						updatedAt: new Date(),
						lifecycle: FileLifeCycle.READY,
					},
					{ transaction }
				)
			}

			await transaction.commit()
			return file
		} catch (e) {
			await transaction.rollback()
			return
		}
	}

	async attachFileToOwner(
		params: {
			fileID: string
			ownerType: OwnerType
			ownerId: string
			purpose?: FilePurpose
			metadata?: Record<string, any>
		},
		transaction: Transaction
	) {
		try {
			const file = await this.fileStorageModel.findByPk(params.fileID, {
				transaction,
			})
			if (!file) {
				throw new NotFoundException('Файл не найден')
			}

			const existing = await this.fileAttachmentModel.findOne({
				where: {
					fileID: params.fileID,
					ownerType: params.ownerType,
					ownerID: params.ownerId,
					purpose: params.purpose,
				},
				transaction,
			})
			if (existing) {
				return existing
			}

			const attachment = await this.fileAttachmentModel.create(
				{
					fileID: params.fileID,
					ownerType: params.ownerType,
					ownerID: params.ownerId,
					purpose: params.purpose || FilePurpose.ORIGINAL,
					metadata: params.metadata || null,
				},
				{ transaction }
			)

			await file.increment('refCount', { by: 1, transaction })
			await file.update({ updatedAt: new Date() }, { transaction })

			return attachment
		} catch (e) {
			return
		}
	}

	async createFile(
		file: Express.Multer.File,
		storageType: FileStorageType,
		transaction: Transaction,
		opts?: {
			filterType: FilesFilterType
			fileDirType: FilesFilterType
			finalizeImmediately?: false
		}
	) {
		const temp = await this.filesService.createTempFile(
			file,
			opts.filterType,
			opts.fileDirType
		)

		const { fileStorage, created } = await this.ingestTempFile(
			temp,
			transaction,
			{
				storageType: storageType,
				incrementRef: false,
				isTemporary: !opts.finalizeImmediately,
			}
		)

		return {
			fileStorage: fileStorage,
			fileType: temp.fileCategory,
			created: created,
			tempFile: temp,
		}
	}

	async attachFile(
		temp: File_Data,
		fileStorage: FileStorage,
		ownerType: OwnerType,
		ownerId: string,
		purpose: FilePurpose,
		created: boolean,
		transaction: Transaction
	) {
		if (!created) {
			await this.filesService.removeLocalTempFile(temp.fileTempPath)
			const attachment = await this.attachFileToOwner(
				{
					fileID: fileStorage.id,
					ownerType: ownerType,
					ownerId: ownerId,
					purpose: purpose,
				},
				transaction
			)
			return {
				fileStorage: fileStorage,
				attachment: attachment,
				existed: true,
			}
		}

		// console.log(`\n\n\t - 4 - \t\n\n`) на самом деле под вопросом
		// if (opts.finalizeImmediately) {
		// 	await this.finalizeFileStorage(storageFile.id)
		// }

		const attachment = await this.attachFileToOwner(
			{
				fileID: fileStorage.id,
				ownerType: ownerType,
				ownerId: ownerId,
				purpose: purpose,
			},
			transaction
		)
		return {
			fileStorage: fileStorage,
			attachment: attachment,
			existed: false,
		}
	}

	async createAndAttachFromUpload(
		file: Express.Multer.File,
		ownerType: OwnerType,
		ownerId: string,
		purpose: FilePurpose,
		storageType: FileStorageType,
		transaction: Transaction,
		opts: {
			filterType: FilesFilterType
			fileDirType: FilesFilterType
			finalizeImmediately: false
		}
	) {
		const createdFile = await this.createFile(file, storageType, transaction, {
			fileDirType: opts.fileDirType,
			filterType: opts.filterType,
			finalizeImmediately: opts.finalizeImmediately,
		})

		const attachedFile = await this.attachFile(
			createdFile.tempFile,
			createdFile.fileStorage,
			ownerType,
			ownerId,
			purpose,
			createdFile.created,
			transaction
		)

		return {
			fileStorage: attachedFile.fileStorage,
			attachment: attachedFile.attachment,
			existed: attachedFile.existed,
			fileType: createdFile.tempFile.fileCategory,
			fileMime: createdFile.tempFile.fileMimeType,
		}
	}

	async findAttachmentByOwnerID(owenrID: string, ownerType: OwnerType) {
		const attachmentID = await this.fileAttachmentModel.findOne({
			attributes: ['id'],
			where: {
				ownerID: owenrID,
				ownerType: ownerType,
			},
		})

		return attachmentID
	}

	async detachAttachment(attachmentID: string, transaction: Transaction) {
		try {
			const attachment = await this.fileAttachmentModel.findByPk(attachmentID, {
				transaction,
			})
			if (!attachment) {
				throw new NotFoundException('Файл не найден')
			}

			const file = await this.fileStorageModel.findByPk(attachment.fileID, {
				transaction,
				lock: transaction.LOCK.UPDATE,
			})
			await attachment.destroy({ transaction })

			await file.decrement('refCount', { by: 1, transaction })
			const refreshed = await file.reload({ transaction })

			if (refreshed.refCount <= 0) {
				await refreshed.update(
					{ lifecycle: FileLifeCycle.DELETING },
					{ transaction }
				)
				// удаление из ФС будет сделано путем corn событий в К8С
			}
		} catch (e) {
			throw new InternalBusinessException('Ошибка при удалении связи файла')
		}
	}
}

const bb = FILES_CONFIG
