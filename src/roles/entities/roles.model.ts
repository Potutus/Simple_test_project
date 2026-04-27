import {
	Table,
	DataType,
	Model,
	Column,
	BelongsToMany,
} from 'sequelize-typescript'
import { User } from 'src/users/entities/users.model'
import { UserRoles } from '../../relationships/user-roles.model'
import { uuidv7 } from 'uuidv7'

interface RoleCreationAttr {
	id: string
	value: string
	description: string
}

@Table({ tableName: 'roles' })
export class Role extends Model<Role, RoleCreationAttr> {
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
	value: string

	@Column({
		type: DataType.STRING,
		allowNull: false,
	})
	description: string

	@BelongsToMany(() => User, () => UserRoles)
	user: User[]
}
