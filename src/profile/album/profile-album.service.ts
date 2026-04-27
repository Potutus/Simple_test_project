import {
	BadRequestException,
	Injectable,
	InternalServerErrorException,
	NotFoundException,
} from '@nestjs/common'
import { InjectModel } from '@nestjs/sequelize'
import { Album } from '../entities/album.model'
import {
	AddMediaToAlbumDto,
	CreateAlbumDto,
	DeleteAlbumDto,
	DeleteFromAlbumDto,
	GetAlbumMediaDto,
	GetAlbumsDto,
	UpdateAlbumDto,
} from '../dto/album.dto'
import { getPaginationParams } from 'src/utils/paginator.service'
import { QueryTypes } from 'sequelize'
import { getAlbumMediaQuery } from './sql-queries/get-album-media.query'
import {
	GetAlbumMediaData,
	GetAlbumMediaDataResponse,
} from 'src/utils/types/get-album-media.type'

@Injectable()
export class AlbumService {
	constructor(
		@InjectModel(Album)
		private readonly albumModel: typeof Album
	) {}

	async albumAccess(albumID: string, profileID: string): Promise<Album> {
		const album = await this.albumModel.findOne({
			attributes: ['id'],
			where: {
				id: albumID,
				profileID: profileID,
			},
		})
		if (!album) {
			throw new NotFoundException(`Альбом не найден :(`)
		}

		return album
	}

	async create(
		createAlbumDto: CreateAlbumDto,
		profileID: string
	): Promise<{
		message: string
	}> {
		await this.albumModel
			.create({
				name: createAlbumDto.name,
				description: createAlbumDto?.description || null,
				profileID: profileID,
			})
			.catch((e) => {
				if (e.name === 'SequelizeUniqueConstraintError') {
					throw new BadRequestException('Имя альбома уже существует.')
				}
				throw new BadRequestException('Неверные данные')
			})

		return {
			message: 'Успех',
		}
	}

	async getAlbumsByProfile(
		getAlbums: GetAlbumsDto,
		profileID: string
	): Promise<{
		count: number
		rows: Album[]
	}> {
		const { limit, offset } = getPaginationParams(getAlbums)
		const orderDirection = getAlbums?.orderDirectionNew ? 'DESC' : 'ASC'

		const albums = await this.albumModel
			.findAndCountAll({
				where: { profileID },
				limit,
				offset,
				order: [['createdAt', orderDirection]],
			})
			.catch((e) => {
				throw new BadRequestException('Что-то пошло не так')
			})

		return albums
	}

	async addMediaToAlbum(
		addMediaToAlbumDto: AddMediaToAlbumDto,
		profileID: string
	): Promise<{
		message: string
	}> {
		const album = await this.albumAccess(addMediaToAlbumDto.albumID, profileID)

		await album.$add('medias', addMediaToAlbumDto.mediaIDs).catch((e) => {
			throw new InternalServerErrorException('Что-то пошло не так')
		})

		return {
			message: 'Добавлено!',
		}
	}

	async getAlbumMedia(
		getAlbumMediaDto: GetAlbumMediaDto,
		profileID: string
	): Promise<{
		rows: GetAlbumMediaDataResponse[]
		count: number
	}> {
		await this.albumAccess(getAlbumMediaDto.albumID, profileID)

		const { limit, offset } = getPaginationParams(getAlbumMediaDto)

		const tagNames = getAlbumMediaDto?.tagNames || new Array<string>()
		const typeTagNames = getAlbumMediaDto?.typeTagNames || new Array<string>()

		const sortOrder =
			getAlbumMediaDto?.orderDirectionNew === true ? 'DESC' : 'ASC'
		const tagFilterMode: 'strict' | 'simple' | '' =
			tagNames?.length > 0 ? getAlbumMediaDto.tagFilterMode : ''
		const typeFilterMode: 'strict' | 'simple' | '' =
			tagNames?.length > 0 ? getAlbumMediaDto.typeFilterMode : ''

		const queryParams = {
			tagArray: tagNames,
			tagType: typeTagNames,
			albumID: getAlbumMediaDto?.albumID,
			limit: limit,
			offset: offset,
		}

		const query = getAlbumMediaQuery(sortOrder, tagFilterMode, typeFilterMode)

		const result = await this.albumModel.sequelize
			.query<GetAlbumMediaData>(query, {
				replacements: queryParams,
				type: QueryTypes.SELECT,
			})
			.catch((e) => {
				throw new BadRequestException('Что-то пошло не так')
			})

		const totalCount: number = result?.length > 0 ? result[0]?.total_count : 0
		const albumMedias: GetAlbumMediaDataResponse[] = result.map(
			({ total_count, ...media }) => media
		)

		return {
			count: totalCount,
			rows: albumMedias,
		}
	}

	async update(
		updateAlbumDto: UpdateAlbumDto,
		profileID: string
	): Promise<{
		message: string
	}> {
		const album = await this.albumAccess(updateAlbumDto.albumID, profileID)

		await album
			.update({
				name: updateAlbumDto?.name,
				description: updateAlbumDto?.description,
			})
			.catch((e) => {
				if (e.name === 'SequelizeUniqueConstraintError') {
					throw new BadRequestException('Имя альбома уже существует.')
				}
				throw new InternalServerErrorException('Что-то пошло не так')
			})

		return {
			message: 'Удалено!',
		}
	}

	async delete(
		deleteAlbumDto: DeleteAlbumDto,
		profileID: string
	): Promise<{ message: string }> {
		const album = await this.albumAccess(deleteAlbumDto.albumID, profileID)

		await album.destroy()
		return { message: 'Альбом успешно удален!' }
	}

	async deleteFromAlbum(
		deleteFromAlbumDto: DeleteFromAlbumDto,
		profileID: string
	): Promise<{ message: string }> {
		const album = await this.albumAccess(deleteFromAlbumDto.albumID, profileID)

		await album.$remove('media', deleteFromAlbumDto.mediaIDs).catch((e) => {
			throw new InternalServerErrorException('Что-то пошло не так')
		})

		return { message: 'Из альбома успешно удалено!' }
	}
}
