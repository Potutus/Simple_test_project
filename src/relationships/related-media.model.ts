import {
	Table,
	DataType,
	Model,
	Column,
	ForeignKey,
	Index,
} from 'sequelize-typescript'
import { Media } from 'src/media/entities/media.model'

interface MediaRelatedCreationAttr {
	mediaID: string
	relatedMediaID: string
}

@Table({ tableName: 'media_related', createdAt: false, updatedAt: false })
export class MediaRelated extends Model<
	MediaRelated,
	MediaRelatedCreationAttr
> {
	@ForeignKey(() => Media)
	@Column({
		type: DataType.UUID,
		allowNull: false,
		primaryKey: true,
	})
	mediaID: string

	@ForeignKey(() => Media)
	@Column({
		type: DataType.UUID,
		allowNull: false,
		primaryKey: true,
	})
	relatedMediaID: string
}
