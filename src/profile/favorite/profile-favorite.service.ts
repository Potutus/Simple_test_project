import {
	BadRequestException,
	Injectable,
	InternalServerErrorException,
	NotFoundException,
} from '@nestjs/common'
import { InjectModel } from '@nestjs/sequelize'
import { Favorite } from '../entities/profile-favorite.model'
import {
	AddToFavoritesDto,
	GetFavoritesDto,
	RemoveFromFavoritesDto,
} from '../dto/favorite.dto'
import { Media } from 'src/media/entities/media.model'
import { Profile } from '../entities/profile.model'
import { getPaginationParams } from 'src/utils/paginator.service'
import { getFavoriteMediaQuery } from './sql-queries/get-favorite-media.query'
import { QueryTypes } from 'sequelize'
import {
	GetFavoriteMediaData,
	GetFavoriteMediaDataResponse,
} from 'src/utils/types/get-favorites.type'

@Injectable()
export class FavoriteService {
	constructor(
		@InjectModel(Profile)
		private readonly profileModel: typeof Profile,
		@InjectModel(Favorite)
		private readonly favoriteModel: typeof Favorite,
		@InjectModel(Media)
		private readonly mediaModel: typeof Media
	) {}

	async profileCheck(profileID: string) {
		const profile = await this.profileModel.findByPk(profileID, {
			attributes: ['id'],
		})

		if (!profile) {
			throw new NotFoundException(`Профиль не найден :(`)
		}

		return profile
	}

	async addToFavorites(
		addToFavoriteDto: AddToFavoritesDto,
		profileID: string
	): Promise<{
		message: string
	}> {
		const profile = await this.profileCheck(profileID)

		await profile.$add('favorites', addToFavoriteDto.mediaIDs).catch((e) => {
			throw new InternalServerErrorException('Что-то пошло не так')
		})

		return {
			message: 'Добавлено!',
		}
	}

	async removeFromFavorites(
		removeFromFavoriteDto: RemoveFromFavoritesDto,
		profileID: string
	): Promise<{
		message: string
	}> {
		const profile = await this.profileCheck(profileID)

		await profile
			.$remove('favorites', removeFromFavoriteDto.mediaIDs)
			.catch((e) => {
				throw new InternalServerErrorException('Что-то пошло не так')
			})

		return {
			message: 'Удалено!',
		}
	}

	async getFavoritesByProfile(
		getFavoritesDto: GetFavoritesDto,
		profileID: string
	): Promise<{ rows: GetFavoriteMediaDataResponse[]; count: number }> {
		await this.profileCheck(profileID)

		const { limit, offset } = getPaginationParams(getFavoritesDto)

		const tagNames = getFavoritesDto?.tagNames || new Array<string>()
		const typeTagNames = getFavoritesDto?.typeTagNames || new Array<string>()

		const sortOrder = getFavoritesDto?.orderDirectionNew ? 'DESC' : 'ASC'
		const tagFilterMode: 'strict' | 'simple' | '' =
			tagNames?.length > 0 ? getFavoritesDto.tagFilterMode : ''
		const typeFilterMode: 'strict' | 'simple' | '' =
			tagNames?.length > 0 ? getFavoritesDto.typeFilterMode : ''

		const queryParams = {
			tagArray: tagNames,
			tagType: typeTagNames,
			profileID: profileID,
			limit: limit,
			offset: offset,
		}

		const query = getFavoriteMediaQuery(
			sortOrder,
			tagFilterMode,
			typeFilterMode
		)

		const result = await this.favoriteModel.sequelize
			.query<GetFavoriteMediaData>(query, {
				replacements: queryParams,
				type: QueryTypes.SELECT,
			})
			.catch((e) => {
				throw new BadRequestException('Что-то пошло не так')
			})

		const totalCount: number = result?.length > 0 ? result[0]?.total_count : 0
		const favoriteMedias: GetFavoriteMediaDataResponse[] = result.map(
			({ total_count, ...media }) => media
		)

		return {
			count: totalCount,
			rows: favoriteMedias,
		}
	}
}
