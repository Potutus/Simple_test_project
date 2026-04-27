import {
	Table,
	DataType,
	Model,
	Column,
	ForeignKey,
} from 'sequelize-typescript'
import { WikiGallery } from '../wiki/entities/wiki-gallery.model'
import { Media } from 'src/media/entities/media.model'

interface WikiGalleryMediaCreationAttr {
	wikiGalleryID: string
	mediaID: string
}

@Table({ tableName: 'wiki_gallery_media' })
export class WikiGalleryMedia extends Model<
	WikiGalleryMedia,
	WikiGalleryMediaCreationAttr
> {
	@ForeignKey(() => WikiGallery)
	@Column({
		type: DataType.UUID,
		allowNull: false,
		primaryKey: true,
	})
	wikiGalleryID: string

	@ForeignKey(() => Media)
	@Column({
		type: DataType.UUID,
		allowNull: false,
		primaryKey: true,
	})
	mediaID: string
}
