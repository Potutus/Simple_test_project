import {
	Table,
	DataType,
	Model,
	Column,
	BelongsToMany,
	HasOne,
} from 'sequelize-typescript'
import { Profile } from 'src/profile/entities/profile.model'
import { Role } from 'src/roles/entities/roles.model'
import { UserRoles } from 'src/relationships/user-roles.model'
import { uuidv7 } from 'uuidv7'
import { Account } from './accounts.model'

export enum AuthMethod {
	CREDENTIALS = 'CREDENTIALS',
	GOOGLE = 'GOOGLE',
	YANDEX = 'YANDEX',
}

interface UserCreationAttr {
	id?: string
	username: string
	email: string
	password: string
	isVerified: boolean
	isTwoFactorEnabled: boolean
	method: AuthMethod
}

@Table({ tableName: 'users' })
export class User extends Model<User, UserCreationAttr> {
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
	username: string

	@Column({
		type: DataType.STRING,
		allowNull: true,
	})
	password: string

	@Column({
		type: DataType.STRING,
		unique: true,
		allowNull: false,
	})
	email: string

	@Column({
		type: DataType.BOOLEAN,
		allowNull: false,
		defaultValue: false,
	})
	isVerified: boolean

	@Column({
		type: DataType.BOOLEAN,
		allowNull: false,
		defaultValue: false,
	})
	isTwoFactorEnabled: boolean

	@Column({
		type: DataType.ENUM(...Object.values(AuthMethod)),
		allowNull: false,
	})
	method: AuthMethod

	@HasOne(() => Profile)
	profile: Profile

	@HasOne(() => Account)
	account: Account

	@BelongsToMany(() => Role, () => UserRoles)
	roles: Role[]
}
