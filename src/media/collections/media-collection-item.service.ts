// // src/media-collection/services/media-collection-item.service.ts
// import {
// 	Injectable,
// 	NotFoundException,
// 	ForbiddenException,
// 	BadRequestException,
// } from '@nestjs/common'
// import { InjectModel } from '@nestjs/sequelize'
// import { MediaCollectionItem } from '../entities/media-collection-item.model'
// import { MediaCollection } from '../entities/media-collection.model'
// import { Media } from 'src/media/entities/media.model'

// @Injectable()
// export class MediaCollectionItemService {
// 	constructor(
// 		@InjectModel(MediaCollectionItem)
// 		private readonly itemModel: typeof MediaCollectionItem,

// 		@InjectModel(MediaCollection)
// 		private readonly collectionModel: typeof MediaCollection,

// 		@InjectModel(Media)
// 		private readonly mediaModel: typeof Media
// 	) {}

// 	// -----------------------------------------------------
// 	// INTERNAL — ensure collection exists
// 	// -----------------------------------------------------
// 	private async getColl(ownerID: string, collectionID: string) {
// 		const coll = await this.collectionModel.findByPk(collectionID)
// 		if (!coll) throw new NotFoundException('Collection not found')
// 		if (coll.ownerID !== ownerID) throw new ForbiddenException()
// 		return coll
// 	}

// 	// -----------------------------------------------------
// 	// ADD ITEM
// 	// -----------------------------------------------------
// 	async addMedia(ownerID: string, collectionID: string, mediaID: string) {
// 		const coll = await this.getColl(ownerID, collectionID)

// 		// validate media exists
// 		const media = await this.mediaModel.findByPk(mediaID)
// 		if (!media) throw new NotFoundException('Media not found')

// 		// get last sortKey
// 		const lastItem = await this.itemModel.findOne({
// 			where: { collectionID },
// 			order: [['sortKey', 'DESC']],
// 		})

// 		const sortKey = lastItem
// 			? LexoRank.parse(lastItem.sortKey).genNext().toString()
// 			: LexoRank.middle().toString()

// 		return this.itemModel.create({
// 			collectionID,
// 			mediaID,
// 			sortKey,
// 		})
// 	}

// 	// -----------------------------------------------------
// 	// REMOVE ITEM
// 	// -----------------------------------------------------
// 	async removeMedia(ownerID: string, collectionID: string, mediaID: string) {
// 		await this.getColl(ownerID, collectionID)

// 		await this.itemModel.destroy({
// 			where: { collectionID, mediaID },
// 		})

// 		return true
// 	}

// 	// -----------------------------------------------------
// 	// REORDER
// 	// -----------------------------------------------------
// 	async reorder(
// 		ownerID: string,
// 		collectionID: string,
// 		mediaID: string,
// 		beforeSortKey?: string
// 	) {
// 		await this.getColl(ownerID, collectionID)

// 		const item = await this.itemModel.findOne({
// 			where: { collectionID, mediaID },
// 		})
// 		if (!item) throw new NotFoundException()

// 		let newSortKey: string

// 		if (!beforeSortKey) {
// 			// move to end
// 			const last = await this.itemModel.findOne({
// 				where: { collectionID },
// 				order: [['sortKey', 'DESC']],
// 			})
// 			newSortKey = LexoRank.parse(last.sortKey).genNext().toString()
// 		} else {
// 			// move before element
// 			const before = LexoRank.parse(beforeSortKey)
// 			const prev = await this.itemModel.findOne({
// 				where: { collectionID, sortKey: { $lt: beforeSortKey } },
// 				order: [['sortKey', 'DESC']],
// 			})

// 			if (!prev) {
// 				newSortKey = before.genPrev().toString()
// 			} else {
// 				newSortKey = LexoRank.parse(prev.sortKey).between(before).toString()
// 			}
// 		}

// 		await item.update({ sortKey: newSortKey })

// 		return item
// 	}

// 	// -----------------------------------------------------
// 	// CLEAR COLLECTION
// 	// -----------------------------------------------------
// 	async clear(ownerID: string, collectionID: string) {
// 		await this.getColl(ownerID, collectionID)
// 		await this.itemModel.destroy({ where: { collectionID } })
// 	}

// 	// -----------------------------------------------------
// 	// BULK REPLACE
// 	// -----------------------------------------------------
// 	async replaceItems(
// 		ownerID: string,
// 		collectionID: string,
// 		mediaIDs: string[]
// 	) {
// 		await this.getColl(ownerID, collectionID)

// 		await this.itemModel.destroy({ where: { collectionID } })

// 		const result = []
// 		let cursor = LexoRank.middle()

// 		for (const id of mediaIDs) {
// 			const record = await this.itemModel.create({
// 				collectionID,
// 				mediaID: id,
// 				sortKey: cursor.toString(),
// 			})
// 			result.push(record)
// 			cursor = cursor.genNext()
// 		}

// 		return result
// 	}
// }
