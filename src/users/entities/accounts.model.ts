import {
	Table,
	DataType,
	Model,
	Column,
	BelongsTo,
	ForeignKey,
} from 'sequelize-typescript'
import { uuidv7 } from 'uuidv7'
import { User } from './users.model'

interface AccountCreationAttr {
	id?: string
	type: string
	provider: string
	refreshToken: string
	accessToken: string
	expiresAt: number
}

@Table({ tableName: 'accounts' })
export class Account extends Model<Account, AccountCreationAttr> {
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
		allowNull: false,
	})
	type: string

	@Column({
		type: DataType.STRING,
		allowNull: false,
	})
	provider: string

	@Column({
		type: DataType.STRING,
		allowNull: true,
	})
	refreshToken: string

	@Column({
		type: DataType.STRING,
		allowNull: true,
	})
	accessToken: string

	@Column({
		type: DataType.INTEGER,
		allowNull: false,
	})
	expiresAt: number

	@BelongsTo(() => User)
	user: User
}
