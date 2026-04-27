import {
	Table,
	DataType,
	Model,
	Column,
	ForeignKey,
} from 'sequelize-typescript'
import { User } from 'src/users/entities/users.model'
import { Role } from '../roles/entities/roles.model'

interface UserRolesCreationAttr {
	roleID: string
	userID: string
}

@Table({ tableName: 'user_roles', createdAt: false, updatedAt: false })
export class UserRoles extends Model<UserRoles, UserRolesCreationAttr> {
	@ForeignKey(() => Role)
	@Column({
		type: DataType.UUID,
		allowNull: false,
		primaryKey: true,
	})
	roleID: string

	@ForeignKey(() => User)
	@Column({
		type: DataType.UUID,
		allowNull: false,
		primaryKey: true,
	})
	userID: string
}
