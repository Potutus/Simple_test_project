import {
	Table,
	DataType,
	Model,
	Column,
	BelongsToMany,
} from 'sequelize-typescript'
import { Tags_TagsType } from 'src/relationships/tags-tagsType.model'
import { Tags } from 'src/tags/entities/tags.model'
import { uuidv7 } from 'uuidv7'

interface TagsTypeCreationAttr {
	id: string
	name: string
	color: string
}

@Table({ tableName: 'tags_type', createdAt: false, updatedAt: false })
export class TagsType extends Model<TagsType, TagsTypeCreationAttr> {
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

	@Column({
		type: DataType.STRING,
		unique: false,
		allowNull: true,
	})
	color: string

	@BelongsToMany(() => Tags, () => Tags_TagsType)
	tags: Tags[]
}
