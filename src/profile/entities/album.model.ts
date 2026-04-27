import {
	Table,
	DataType,
	Model,
	Column,
	ForeignKey,
	BelongsTo,
	BelongsToMany,
} from 'sequelize-typescript'
import { Profile } from 'src/profile/entities/profile.model'
import { Media } from 'src/media/entities/media.model'
import { AlbumMedia } from 'src/relationships/album-media.model'
import { uuidv7 } from 'uuidv7'

interface AlbumCreationAttr {
	id: string
	profileID: string
	name: string
	description: string
	logo: string
}

@Table({ tableName: 'profile_albums' })
export class Album extends Model<Album, AlbumCreationAttr> {
	@Column({
		type: DataType.UUID,
		unique: true,
		primaryKey: true,
		allowNull: false,
		defaultValue: uuidv7,
	})
	id: string

	@ForeignKey(() => Profile)
	@Column({
		type: DataType.UUID,
		allowNull: false,
	})
	profileID: string

	@Column({
		type: DataType.STRING,
		allowNull: false,
		unique: true,
	})
	name: string

	@Column({
		type: DataType.TEXT,
		allowNull: true,
	})
	description: string

	@Column({
		type: DataType.STRING,
		allowNull: true,
	})
	logo: string

	@BelongsTo(() => Profile)
	profile: Profile

	@BelongsToMany(() => Media, () => AlbumMedia)
	medias: Media[]
}
