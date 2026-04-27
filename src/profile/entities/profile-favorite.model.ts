import {
	Table,
	Model,
	ForeignKey,
	Column,
	DataType,
} from 'sequelize-typescript'
import { Profile } from './profile.model'
import { Media } from 'src/media/entities/media.model'

@Table({ tableName: 'profile_favorites', createdAt: true, updatedAt: true })
export class Favorite extends Model {
	@ForeignKey(() => Profile)
	@Column({
		type: DataType.UUID,
		allowNull: false,
		primaryKey: true,
	})
	profileID: string

	@ForeignKey(() => Media)
	@Column({
		type: DataType.UUID,
		allowNull: false,
		primaryKey: true,
	})
	mediaID: string
}
