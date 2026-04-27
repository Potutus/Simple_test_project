import {
	Table,
	DataType,
	Model,
	Column,
	ForeignKey,
} from 'sequelize-typescript'
import { Tags } from '../tags/entities/tags.model'
import { Media } from 'src/media/entities/media.model'

interface MediaTagsCreationAttr {
	tagID: string
	mediaID: string
}

@Table({ tableName: 'media_tags', createdAt: false, updatedAt: false })
export class MediaTags extends Model<MediaTags, MediaTagsCreationAttr> {
	@ForeignKey(() => Tags)
	@Column({
		type: DataType.UUID,
		allowNull: false,
		primaryKey: true,
	})
	tagID: string

	@ForeignKey(() => Media)
	@Column({
		type: DataType.UUID,
		allowNull: false,
		primaryKey: true,
	})
	mediaID: string
}
