import {
	Table,
	Model,
	ForeignKey,
	Column,
	DataType,
} from 'sequelize-typescript'
import { Album } from 'src/profile/entities/album.model'
import { Media } from 'src/media/entities/media.model'

@Table({ tableName: 'albums_media' })
export class AlbumMedia extends Model {
	@ForeignKey(() => Album)
	@Column({
		type: DataType.UUID,
		allowNull: false,
		primaryKey: true,
	})
	albumID: string

	@ForeignKey(() => Media)
	@Column({
		type: DataType.UUID,
		allowNull: false,
		primaryKey: true,
	})
	mediaID: string
}
