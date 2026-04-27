import { BadRequestException, Injectable } from '@nestjs/common'
import { TagTypeDto, UpdateTagTypeDto } from './dto/tags-type.dto'
import { InjectModel } from '@nestjs/sequelize'
import { TagsType } from './entities/tags-type.model'

@Injectable()
export class TagsTypeService {
	constructor(
		@InjectModel(TagsType)
		private readonly tagsTypeModel: typeof TagsType
	) {}

	async create(tagTypeDto: TagTypeDto): Promise<{
		message: string
	}> {
		await this.tagsTypeModel
			.create({
				name: tagTypeDto.name,
			})
			.catch((e) => {
				throw new BadRequestException('Неверные входные данные')
			})

		return {
			message: 'Успех!',
		}
	}

	async update(tagTypeDto: UpdateTagTypeDto): Promise<{
		message: string
	}> {
		await this.tagsTypeModel
			.update(
				{
					name: tagTypeDto?.name,
					color: tagTypeDto?.color,
				},
				{
					where: {
						id: tagTypeDto?.tagTypeID,
					},
				}
			)
			.catch((e) => {
				const constraint = e.parent?.constraint

				if (constraint === 'tagType_pkey') {
					throw new BadRequestException('Такого типа тега не существует')
				}

				if (constraint === 'tagType_name_key') {
					throw new BadRequestException(
						'Такое название типа тега уже существует'
					)
				}

				throw new BadRequestException('Неверные входные данные')
			})

		return {
			message: 'Успех!',
		}
	}

	async getAll(): Promise<TagsType[]> {
		const tagsType = await this.tagsTypeModel.findAll().catch((e) => {
			throw new BadRequestException('Не удалось получить данные')
		})

		return tagsType
	}

	async getOne(name: string): Promise<TagsType> {
		const tagType = await this.tagsTypeModel.findOne({
			attributes: ['id'],
			where: {
				name: name,
			},
		})

		return tagType
	}

	async remove(tagTypeDto: TagTypeDto): Promise<{
		message: string
	}> {
		await this.tagsTypeModel
			.destroy({
				where: {
					name: tagTypeDto.name,
				},
			})
			.catch((e) => {
				throw new BadRequestException('Неверные входные данные')
			})

		return { message: 'Успех!' }
	}
}
