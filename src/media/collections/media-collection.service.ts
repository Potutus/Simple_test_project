// // src/media-collection/services/media-collection.service.ts
// import {
// 	Injectable,
// 	NotFoundException,
// 	ForbiddenException,
// } from '@nestjs/common'
// import { InjectModel } from '@nestjs/sequelize'
// import { MediaCollection } from '../entities/media-collection.model'
// import { MediaCollectionItem } from '../entities/media-collection-item.model'
// import { Media } from 'src/media/entities/media.model'
// import {
// 	MediaColletionCreateAttr,
// 	MediaCollectionVisibility,
// 	MediaCollectionType,
// } from '../entities/media-collection.model'

// @Injectable()
// export class MediaCollectionService {
// 	constructor(
// 		@InjectModel(MediaCollection)
// 		private readonly collectionModel: typeof MediaCollection,

// 		@InjectModel(MediaCollectionItem)
// 		private readonly itemModel: typeof MediaCollectionItem,

// 		@InjectModel(Media)
// 		private readonly mediaModel: typeof Media
// 	) {}

// 	// -----------------------------------------------------
// 	// CREATE
// 	// -----------------------------------------------------
// 	async createCollection(dto: MediaColletionCreateAttr) {
// 		return this.collectionModel.create(dto)
// 	}

// 	// -----------------------------------------------------
// 	// UPDATE
// 	// -----------------------------------------------------
// 	async updateCollection(
// 		ownerID: string,
// 		id: string,
// 		dto: Partial<MediaColletionCreateAttr>
// 	) {
// 		const coll = await this.collectionModel.findByPk(id)
// 		if (!coll) throw new NotFoundException('Collection not found')
// 		if (coll.ownerID !== ownerID) throw new ForbiddenException()

// 		await coll.update(dto)
// 		return coll
// 	}

// 	// -----------------------------------------------------
// 	// DELETE
// 	// -----------------------------------------------------
// 	async deleteCollection(ownerID: string, id: string) {
// 		const coll = await this.collectionModel.findByPk(id)
// 		if (!coll) throw new NotFoundException()
// 		if (coll.ownerID !== ownerID) throw new ForbiddenException()

// 		// удаляем элементы
// 		await this.itemModel.destroy({ where: { collectionID: id } })

// 		// удаляем коллекцию
// 		await coll.destroy()
// 	}

// 	// -----------------------------------------------------
// 	// GET
// 	// -----------------------------------------------------
// 	async getCollection(ownerID: string, id: string) {
// 		const coll = await this.collectionModel.findByPk(id)
// 		if (!coll) throw new NotFoundException()
// 		if (coll.ownerID !== ownerID) throw new ForbiddenException()

// 		return coll
// 	}

// 	// -----------------------------------------------------
// 	// LIST
// 	// -----------------------------------------------------
// 	async listCollections(
// 		ownerID: string,
// 		opts?: { type?: MediaCollectionType }
// 	) {
// 		return this.collectionModel.findAll({
// 			where: {
// 				ownerID,
// 				...(opts?.type ? { type: opts.type } : {}),
// 			},
// 			order: [['createdAt', 'DESC']],
// 		})
// 	}

// 	// -----------------------------------------------------
// 	// PUBLISH / UNLIST
// 	// -----------------------------------------------------
// 	async publishCollection(ownerID: string, id: string) {
// 		const coll = await this.getCollection(ownerID, id)
// 		await coll.update({ visibility: MediaCollectionVisibility.PUBLIC })
// 		return coll
// 	}

// 	async unlistCollection(ownerID: string, id: string) {
// 		const coll = await this.getCollection(ownerID, id)
// 		await coll.update({ visibility: MediaCollectionVisibility.UNLISTED })
// 		return coll
// 	}

// 	// -----------------------------------------------------
// 	// VALIDATE MEDIA TYPE MATCH
// 	// -----------------------------------------------------
// 	async validateMediaType(mediaID: string, type: MediaCollectionType) {
// 		const media = await this.mediaModel.findByPk(mediaID)
// 		if (!media) throw new NotFoundException(`Media ${mediaID} not found`)

// 		// Маппинг: IMAGE_ALBUM → IMAGE, VIDEO_PLAYLIST → VIDEO, AUDIO_PLAYLIST → AUDIO
// 		const map = {
// 			IMAGE_ALBUM: 'IMAGE',
// 			VIDEO_PLAYLIST: 'VIDEO',
// 			AUDIO_PLAYLIST: 'AUDIO',
// 		}

// 		if (media.fileType !== map[type]) {
// 			throw new ForbiddenException(
// 				`Media type ${media.fileType} is not allowed in collection type ${type}`
// 			)
// 		}

// 		return true
// 	}
// }
