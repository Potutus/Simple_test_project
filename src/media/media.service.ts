import {
	Injectable,
	BadRequestException,
	NotFoundException,
	InternalServerErrorException,
} from '@nestjs/common'
import { InjectModel } from '@nestjs/sequelize'
import { Media, MediaStatus, MediaType } from './entities/media.model'
import { MediaDto, UpdateMediasDto } from './dto/media.dto'
import { FilesService } from 'src/files/files.service'
import { MediaTAService } from './media-action-tags.service'
import { QueryTypes, Transaction } from 'sequelize'
import { GetMediasDto, RemoveMediaDto } from './dto/media.dto'
import { getPaginationParams } from 'src/utils/paginator.service'
import { getMediaQuery } from './sql-queries/get-medias.query'
import { removeMediaQuery } from './sql-queries/remove-media.query'
import { FILES_CONFIG, FILES_CONFIG_DIR } from 'src/utils/const.config'
import {
	GetMediaData,
	GetMediaDataResponse,
} from 'src/utils/types/get-medias.type'
import { MediaGetAllResponse } from 'src/utils/types/get-all-media-response'
import {
	FilePurpose,
	OwnerType,
} from 'src/files/entities/file-attachment.model'
import { FileManagerService } from 'src/files/files-manager.service'
import { FileStorageType } from 'src/files/entities/file-storage.model'
import { removeAllTagsFromMediasQuery } from './sql-queries/remove-all-tags-from-media.query'
import { uuidv7 } from 'uuidv7'

@Injectable()
export class MediaService {
	constructor(
		@InjectModel(Media)
		private readonly mediaModel: typeof Media,
		private readonly fileManager: FileManagerService,
		private readonly mediaTAService: MediaTAService
	) {}

	private getFileCategoryFromMime(mime: string): MediaType {
		if (mime.startsWith('image/')) return MediaType.IMAGE
		if (mime.startsWith('video/')) return MediaType.VIDEO
		if (mime.startsWith('audio/')) return MediaType.AUDIO
	}

	async findById(mediaID): Promise<Media> {
		return await this.mediaModel.findByPk(mediaID)
	}

	async createOne(
		createDto: MediaDto,
		file: Express.Multer.File,
		userID: string
	): Promise<{ id: string; status: string }> {
		if (!file) {
			throw new BadRequestException('Файл отсутствует')
		}

		const transaction = await this.mediaModel.sequelize.transaction()

		let mediaIDCache: string

		try {
			const mediaNameToCreate = `${file.originalname}_${Date.now()}`

			const mediaID = uuidv7()

			const result = await this.fileManager.createAndAttachFromUpload(
				file,
				OwnerType.MEDIA,
				mediaID,
				FilePurpose.ORIGINAL,
				FileStorageType.LOCAL,
				transaction,
				{
					filterType: FILES_CONFIG.MEDIA.TYPE,
					fileDirType: FILES_CONFIG.MEDIA.TYPE,
					finalizeImmediately: false,
				}
			)

			const fileType = this.getFileCategoryFromMime(result.fileMime)

			const media = await this.mediaModel.create(
				{
					id: mediaID,
					name: mediaNameToCreate,
					visibility: createDto.visibility,
					ownerID: userID,
					type: fileType,
				},
				{
					returning: ['id', 'name', 'status'],
					transaction,
				}
			)

			mediaIDCache = media.id

			// result.fileType

			await media.update(
				{
					status: MediaStatus.READY,
					metadata: result.fileStorage?.metadata ?? null,
				},
				{ transaction }
			)

			await transaction.commit()

			if (result.fileStorage?.id && !result.existed) {
				await this.fileManager
					.finalizeFileStorage(result.fileStorage.id)
					.catch((finalizeErr) => {
						console.error(
							`Ошибка финализации файла ${result.fileStorage.id}:`,
							finalizeErr
						)
					})
			}

			media.reload()

			return { id: media.id, status: media.status }
		} catch (e) {
			await transaction.rollback()

			return { id: mediaIDCache, status: MediaStatus.FAILED }
		}
	}

	async createMany(
		createDto: MediaDto,
		files: Array<Express.Multer.File>,
		userID: string
	): Promise<{
		message: string
		results: Array<{ id: string; status: string }>
	}> {
		if (!files?.length) {
			throw new BadRequestException('Файлы отсутствуют')
		}

		const transaction = await this.mediaModel.sequelize.transaction()

		const results = await Promise.all(
			files.map((file) => this.createOne(createDto, file, userID))
		)

		const readyIDs = results
			.filter((r) => r.status === MediaStatus.READY)
			.map((r) => r.id)

		try {
			if (createDto?.tagIDs?.length && readyIDs.length > 0) {
				await this.mediaTAService.addTagsToMedias(
					{
						...createDto,
						mediaIDs: readyIDs,
						tagIDs: createDto.tagIDs,
					},
					transaction
				)
			}

			await transaction.commit()
		} catch (e) {
			await transaction.rollback()
		}

		return { message: 'Загрузка завершена', results }
	}

	async update(updateMediasDto: UpdateMediasDto): Promise<{ message: string }> {
		const media = await this.findById(updateMediasDto.mediaID)

		if (!media) {
			throw new NotFoundException('Медиа не найдена')
		}

		media
			.update({
				name: updateMediasDto?.name,
				description: updateMediasDto?.description,
			})
			.catch((e) => {
				const constraint = e.parent?.constraint

				if (constraint === 'media_name_key') {
					throw new BadRequestException('Такое название медиа уже существует')
				}

				throw new InternalServerErrorException('Ошибка при обновлении медиа')
			})

		return {
			message: 'Обновлено!',
		}
	}

	async remove(removeMediaDto: RemoveMediaDto): Promise<{ message: string }> {
		const transaction = await this.mediaModel.sequelize.transaction()

		try {
			const media = await this.findById(removeMediaDto.mediaID)

			if (!media.id) {
				throw new NotFoundException('Медиа не найдена')
			}

			const attachment = await this.fileManager.findAttachmentByOwnerID(
				removeMediaDto.mediaID,
				OwnerType.MEDIA
			)

			if (!attachment.id) {
				throw new NotFoundException('Файл не найден')
			}

			const queryParams = {
				mediaID: media.id,
			}

			const query = removeAllTagsFromMediasQuery()

			await this.mediaModel.sequelize.query(query, {
				replacements: queryParams,
				type: QueryTypes.DELETE,
				transaction: transaction,
			})

			await media.destroy({ transaction })

			await this.fileManager.detachAttachment(attachment.id, transaction)

			await transaction.commit()

			return { message: 'Файл удален' }
		} catch (e) {
			await transaction.rollback()
			throw new InternalServerErrorException(
				'Произошла ошибка при удалении медиа'
			)
		}
	}

	async getAll(mediaFilterDto: MediaDto): Promise<MediaGetAllResponse> {
		const { limit, offset } = getPaginationParams(mediaFilterDto)

		const tagNames = mediaFilterDto?.tagNames || new Array<string>()
		const typeTagNames = mediaFilterDto?.typeTagNames || new Array<string>()

		const sortOrder = mediaFilterDto?.orderDirectionNew ? 'DESC' : 'ASC'
		const tagFilterMode: 'strict' | 'simple' | '' =
			tagNames?.length > 0 ? mediaFilterDto.tagFilterMode : ''
		const typeFilterMode: 'strict' | 'simple' | '' =
			tagNames?.length > 0 ? mediaFilterDto.typeFilterMode : ''

		const queryParams = {
			tagArray: tagNames,
			tagType: typeTagNames,
			limit: limit,
			offset: offset,
		}

		const query = getMediaQuery(sortOrder, tagFilterMode, typeFilterMode)

		const result = await this.mediaModel.sequelize.query<GetMediaData>(query, {
			replacements: queryParams,
			type: QueryTypes.SELECT,
		})

		const totalCount: number = result?.length > 0 ? result[0]?.total_count : 0

		const medias: GetMediaDataResponse[] = result.map(
			({ total_count, ...media }) => media
		)

		return {
			count: totalCount,
			rows: medias,
		}
	}

	async getOne(name: string): Promise<Media> {
		const media = await this.mediaModel.findOne({
			where: {
				name: name,
			},
			include: {
				all: true,
			},
		})

		if (!media) {
			throw new NotFoundException('Файл не найден')
		}

		return media
	}

	async getSome(getMediasDto: GetMediasDto) {
		const medias = await this.mediaModel.findAll({
			where: {
				id: getMediasDto.mediaIDs,
			},
		})
		return medias
	}
}
