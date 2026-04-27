import {
	Table,
	DataType,
	Model,
	Column,
	ForeignKey,
} from 'sequelize-typescript'
import { TagsType } from '../tags-type/entities/tags-type.model'
import { Tags } from 'src/tags/entities/tags.model'

interface Tags_TagsTypeCreationAttr {
	tagID: string
	tagTypeID: string
}

@Table({ tableName: 'tags_tags_type', createdAt: false, updatedAt: false })
export class Tags_TagsType extends Model<
	Tags_TagsType,
	Tags_TagsTypeCreationAttr
> {
	@ForeignKey(() => Tags)
	@Column({
		type: DataType.UUID,
		allowNull: false,
		primaryKey: true,
	})
	tagID: string

	@ForeignKey(() => TagsType)
	@Column({
		type: DataType.UUID,
		allowNull: false,
		primaryKey: true,
	})
	tagTypeID: string
}
