import {
	BadRequestException,
	Injectable,
	InternalServerErrorException,
	NotFoundException,
} from '@nestjs/common'
import { InjectModel } from '@nestjs/sequelize'
import { Tags } from './entities/tags.model'
import {
	AddTagTypeToTagDto,
	DeleteTagTypeFromTagDto,
	TagDto,
	UpdateTagDto,
} from './dto/tag.dto'

@Injectable()
export class TagsService {
	constructor(
		@InjectModel(Tags)
		private readonly tagsModel: typeof Tags
	) {}

	async create(tagDto: TagDto): Promise<Tags> {
		const tag = await this.tagsModel
			.create({
				name: tagDto.name,
			})
			.catch((e) => {
				throw new BadRequestException('Неверные входные данные')
			})

		return tag
	}

	async remove(tagDto: TagDto): Promise<{ message: string }> {
		await this.tagsModel
			.destroy({
				where: {
					name: tagDto.name,
				},
			})
			.catch((e) => {
				throw new BadRequestException('Неверные входные данные')
			})

		return { message: 'Успех!' }
	}

	async addTagTypeToTag(
		addTagTypeToTagDto: AddTagTypeToTagDto
	): Promise<{ message: string }> {
		const tag = await this.tagsModel.findByPk(addTagTypeToTagDto?.tagID)

		if (!tag) {
			throw new NotFoundException('Тег не найден')
		}

		await tag.$set('tagsType', addTagTypeToTagDto?.tagTypeID).catch((e) => {
			throw new InternalServerErrorException(
				'При присвоении типа тега произошла ошибка'
			)
		})

		return {
			message: 'Добавлено!',
		}
	}

	async deleteTagTypeFromTag(
		deleteTagTypeFromTagDto: DeleteTagTypeFromTagDto
	): Promise<{ message: string }> {
		const tag = await this.tagsModel.findByPk(deleteTagTypeFromTagDto?.tagID)

		if (!tag) {
			throw new NotFoundException('Тег не найден')
		}

		await tag
			.$remove('tagsType', deleteTagTypeFromTagDto?.tagTypeID)
			.catch((e) => {
				throw new InternalServerErrorException(
					'При удалении типа тега от тега произошла ошибка'
				)
			})

		return {
			message: 'Удалено!',
		}
	}

	async update(tagDto: UpdateTagDto): Promise<{
		message: string
	}> {
		await this.tagsModel
			.update(
				{
					name: tagDto?.name,
					description: tagDto?.description,
				},
				{
					where: {
						id: tagDto?.tagID,
					},
				}
			)
			.catch((e) => {
				const constraint = e.parent?.constraint

				if (constraint === 'tags_pkey') {
					throw new BadRequestException('Такого тега не существует')
				}

				if (constraint === 'tags_name_key') {
					throw new BadRequestException('Такое название тега уже существует')
				}

				throw new BadRequestException('Неверные входные данные')
			})

		return {
			message: 'Успех!',
		}
	}

	async getAll(): Promise<Tags[]> {
		const tags = await this.tagsModel.findAll().catch((err) => {
			throw new BadRequestException('Не удалось получить данные')
		})

		return tags
	}

	async getOne(name: string): Promise<Tags> {
		const tag = await this.tagsModel.findOne({
			attributes: ['id'],
			where: {
				name: name,
			},
		})

		return tag
	}
}
