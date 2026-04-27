import {
	BelongsTo,
	Column,
	DataType,
	ForeignKey,
	Model,
	Table,
} from 'sequelize-typescript'
import { MediaCollection } from './media-collection.model'
import { Media } from 'src/media/entities/media.model'

@Table({ tableName: 'media_collection_item' })
export class MediaCollectionItem extends Model<MediaCollectionItem> {
	@ForeignKey(() => MediaCollection)
	@Column({
		type: DataType.UUID,
		allowNull: false,
	})
	collectionID: string

	@BelongsTo(() => MediaCollection)
	collection: MediaCollection

	@ForeignKey(() => Media)
	@Column({
		type: DataType.UUID,
		allowNull: false,
	})
	mediaID: string

	@Column({
		type: DataType.STRING(32),
		allowNull: false,
	})
	sortKey: string
}
