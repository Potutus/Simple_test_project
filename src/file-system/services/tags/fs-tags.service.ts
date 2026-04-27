import {
	Injectable,
	ConflictException,
	NotFoundException,
} from '@nestjs/common'
import { InjectModel } from '@nestjs/sequelize'
import { Sequelize, Op } from 'sequelize'
import { FSTags } from '../../entities/file-system-tag.model'
import { FSNodeTag } from '../../entities/file-system-node-tag.model'

@Injectable()
export class FSTagsService {
	constructor(
		@InjectModel(FSTags)
		private readonly tagModel: typeof FSTags,

		@InjectModel(FSNodeTag)
		private readonly nodeTagModel: typeof FSNodeTag,

		private readonly sequelize: Sequelize
	) {}

	// -------------------------------------------------------------
	// CREATE
	// -------------------------------------------------------------

	async createTag(
		ownerID: string,
		data: { name: string; color?: string; description?: string }
	) {
		const exists = await this.tagModel.findOne({
			where: { ownerID, name: data.name },
		})
		if (exists) throw new ConflictException('Tag with this name already exists')

		return this.tagModel.create({
			ownerID,
			name: data.name,
			color: data.color ?? null,
			description: data.description ?? null,
		})
	}

	// -------------------------------------------------------------
	// LIST
	// -------------------------------------------------------------

	async listTags(ownerID: string) {
		return this.tagModel.findAll({
			where: { ownerID },
			order: [['name', 'ASC']],
		})
	}

	// -------------------------------------------------------------
	// UPDATE
	// -------------------------------------------------------------

	async updateTag(
		ownerID: string,
		tagID: string,
		patch: Partial<{ name: string; color: string; description: string }>
	) {
		const tag = await this.tagModel.findOne({ where: { id: tagID, ownerID } })
		if (!tag) throw new NotFoundException('Tag not found')

		if (patch.name) {
			const exists = await this.tagModel.findOne({
				where: {
					ownerID,
					name: patch.name,
					id: { [Op.ne]: tagID },
				},
			})
			if (exists) throw new ConflictException('Tag name already in use')
		}

		Object.assign(tag, patch)
		await tag.save()
		return tag
	}

	// -------------------------------------------------------------
	// DELETE
	// -------------------------------------------------------------

	async deleteTag(ownerID: string, tagID: string) {
		const tag = await this.tagModel.findOne({
			where: { id: tagID, ownerID },
		})
		if (!tag) throw new NotFoundException('Tag not found')

		const tx = await this.sequelize.transaction()
		try {
			// удалить связи
			await this.nodeTagModel.destroy({
				where: { tagID },
				transaction: tx,
			})

			// удалить тег
			await tag.destroy({ transaction: tx })

			await tx.commit()
			return { deleted: true }
		} catch (err) {
			await tx.rollback()
			throw err
		}
	}
}
