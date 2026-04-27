// // src/media-collection/services/media-collection-public.service.ts
// import {
// 	Injectable,
// 	NotFoundException,
// 	ForbiddenException,
// } from '@nestjs/common'
// import { InjectModel } from '@nestjs/sequelize'
// import { MediaCollection } from '../entities/media-collection.model'
// import { MediaCollectionItem } from '../entities/media-collection-item.model'
// import { MediaCollectionVisibility } from '../entities/media-collection.model'
// import { Media } from 'src/media/entities/media.model'

// @Injectable()
// export class MediaCollectionPublicService {
// 	constructor(
// 		@InjectModel(MediaCollection)
// 		private readonly collectionModel: typeof MediaCollection,

// 		@InjectModel(MediaCollectionItem)
// 		private readonly itemModel: typeof MediaCollectionItem,

// 		@InjectModel(Media)
// 		private readonly mediaModel: typeof Media
// 	) {}

// 	// -----------------------------------------------------
// 	// GET PUBLIC COLLECTION
// 	// -----------------------------------------------------
// 	async getPublicCollection(id: string) {
// 		const coll = await this.collectionModel.findByPk(id)
// 		if (!coll) throw new NotFoundException()

// 		if (coll.visibility !== MediaCollectionVisibility.PUBLIC) {
// 			throw new ForbiddenException('Collection is not public')
// 		}

// 		return coll
// 	}

// 	// -----------------------------------------------------
// 	// GET ITEMS (PAGINATION)
// 	// -----------------------------------------------------
// 	async getItems(collectionID: string, page = 1, limit = 50) {
// 		const offset = (page - 1) * limit

// 		const items = await this.itemModel.findAll({
// 			where: { collectionID },
// 			order: [['sortKey', 'ASC']],
// 			limit,
// 			offset,
// 			include: [{ model: this.mediaModel }],
// 		})

// 		return items
// 	}
// }
