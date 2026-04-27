import {
	Table,
	DataType,
	Model,
	Column,
	BelongsTo,
	ForeignKey,
	HasMany,
	BelongsToMany,
} from 'sequelize-typescript'
import { User } from 'src/users/entities/users.model'
import { Album } from 'src/profile/entities/album.model'
import { Favorite } from './profile-favorite.model'
import { Media } from 'src/media/entities/media.model'
import { uuidv7 } from 'uuidv7'

interface ProfileCreationAttr {
	id?: string
	userID: string
	avatarPath?: string
}

interface Options {
	theme: string
	gridType: string //'BOX' | 'VERTICAL' | 'COLUMN'
	customColorScheme: {}
}

@Table({ tableName: 'profiles' })
export class Profile extends Model<Profile, ProfileCreationAttr> {
	@Column({
		type: DataType.UUID,
		unique: true,
		primaryKey: true,
		allowNull: false,
		defaultValue: uuidv7,
	})
	id: string

	@ForeignKey(() => User)
	@Column({
		type: DataType.UUID,
		allowNull: false,
	})
	userID: string

	@Column({
		type: DataType.STRING,
		allowNull: true,
	})
	avatarPath: string

	@Column({
		type: DataType.JSONB,
		defaultValue: {},
	})
	options: Options

	@BelongsTo(() => User)
	user: User

	@BelongsToMany(() => Media, () => Favorite)
	favorites: Media[]

	@HasMany(() => Album)
	albums: Album[]
}
