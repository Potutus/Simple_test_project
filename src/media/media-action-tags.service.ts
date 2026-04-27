import { BadRequestException, Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/sequelize'
import { Media } from './entities/media.model'
import { MediaDto } from './dto/media.dto'
import { addTagsToMediasQuery } from './sql-queries/add-tags-to-medias.query'
import { QueryTypes, Transaction } from 'sequelize'
import { removeTagsFromMediasQuery } from './sql-queries/remove-tags-from-medias.query'

@Injectable()
export class MediaTAService {
	constructor(
		@InjectModel(Media)
		private mediaModel: typeof Media
	) {}

	async addTagsToMedias(
		addTagsMediaDto: MediaDto,
		transaction?: Transaction
	): Promise<{ message: string }> {
		if (
			!addTagsMediaDto?.mediaIDs?.length ||
			!addTagsMediaDto?.tagIDs?.length
		) {
			throw new BadRequestException('Отсутствует список файлов или тегов')
		}

		const queryParams = {
			mediaIDs: addTagsMediaDto.mediaIDs,
			tagIDs: addTagsMediaDto.tagIDs,
		}

		const query = addTagsToMediasQuery()

		await this.mediaModel.sequelize.query(query, {
			replacements: queryParams,
			type: QueryTypes.INSERT,
			transaction,
		})

		return {
			message: 'Добавлено!',
		}
	}

	async removeTagsFromMedias(
		removeTagsMediaDto: MediaDto,
		transaction?: Transaction
	) {
		if (
			!removeTagsMediaDto?.mediaIDs?.length ||
			!removeTagsMediaDto?.tagIDs?.length
		) {
			throw new BadRequestException('Отсутствует список файлов или тегов')
		}

		const queryParams = {
			mediaIDs: removeTagsMediaDto.mediaIDs,
			tagIDs: removeTagsMediaDto.tagIDs,
		}

		const query = removeTagsFromMediasQuery()

		await this.mediaModel.sequelize.query(query, {
			replacements: queryParams,
			type: QueryTypes.DELETE,
			transaction,
		})

		return {
			message: 'Удалено!',
		}
	}
}
