import {
	BadRequestException,
	Injectable,
	InternalServerErrorException,
	NotFoundException,
} from '@nestjs/common'
import { InjectModel } from '@nestjs/sequelize'
import { Media } from './entities/media.model'
import { AddMediaRelationDto, RemoveMediaRelationDto } from './dto/media.dto'

@Injectable()
export class MediaRelationService {
	constructor(
		@InjectModel(Media)
		private mediaModel: typeof Media
	) {}

	private async mediaCheck(mediaID: string): Promise<Media> {
		const media = await this.mediaModel.findByPk(mediaID, {
			attributes: ['id'],
		})

		if (!media) {
			throw new NotFoundException('Медиа не найдена')
		}

		return media
	}

	async add(addMediaRelationDto: AddMediaRelationDto) {
		const media = await this.mediaCheck(addMediaRelationDto?.mediaID)

		await media
			.$add('relatedMedia', addMediaRelationDto?.relationMediaIDs)
			.catch((e) => {
				throw new InternalServerErrorException(
					'Ошибка при установке связи медиа'
				)
			})

		return {
			message: 'Добавлено!',
		}
	}

	async remove(removeMediaRelationDto: RemoveMediaRelationDto) {
		const media = await this.mediaCheck(removeMediaRelationDto?.mediaID)

		await media
			.$remove('relatedMedia', removeMediaRelationDto?.relationMediaIDs)
			.catch((e) => {
				throw new InternalServerErrorException(
					'Ошибка при удалении связи медиа'
				)
			})

		return {
			message: 'Удалено!',
		}
	}
}
