import {
	Table,
	DataType,
	Model,
	Column,
	ForeignKey,
} from 'sequelize-typescript'
import { Tags } from '../tags/entities/tags.model'
import { Wiki } from 'src/wiki/entities/wiki.model'

interface WikiTagsCreationAttr {
	tagID: string
	wikiID: string
}

@Table({ tableName: 'wiki_tags', createdAt: false, updatedAt: false })
export class WikiTags extends Model<WikiTags, WikiTagsCreationAttr> {
	@ForeignKey(() => Tags)
	@Column({
		type: DataType.UUID,
		allowNull: false,
		primaryKey: true,
	})
	tagID: string

	@ForeignKey(() => Wiki)
	@Column({
		type: DataType.UUID,
		allowNull: false,
		primaryKey: true,
	})
	wikiID: string
}
