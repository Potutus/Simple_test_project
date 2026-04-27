import {
	Table,
	DataType,
	Model,
	Column,
	BelongsToMany,
} from 'sequelize-typescript'
import { Media } from 'src/media/entities/media.model'
import { MediaTags } from '../../relationships/media-tags.model'
import { Wiki } from 'src/wiki/entities/wiki.model'
import { WikiTags } from 'src/relationships/wiki-tags.model'
import { TagsType } from 'src/tags-type/entities/tags-type.model'
import { Tags_TagsType } from 'src/relationships/tags-tagsType.model'
import { uuidv7 } from 'uuidv7'

interface TagsCreationAttr {
	id: string
	name: string
}

@Table({
	tableName: 'tags',
	createdAt: false,
	updatedAt: false,
})
export class Tags extends Model<Tags, TagsCreationAttr> {
	@Column({
		type: DataType.UUID,
		unique: true,
		primaryKey: true,
		allowNull: false,
		defaultValue: uuidv7,
	})
	id: string

	@Column({
		type: DataType.STRING,
		unique: true,
		allowNull: false,
	})
	name: string

	@Column({
		type: DataType.TEXT,
		unique: false,
		allowNull: true,
	})
	description: string

	@BelongsToMany(() => Media, () => MediaTags)
	media: Media[]

	@BelongsToMany(() => TagsType, () => Tags_TagsType)
	tagsType: TagsType[]

	@BelongsToMany(() => Wiki, () => WikiTags)
	wiki: Wiki[]
}
