import { Table, DataType, Model, Column } from 'sequelize-typescript'
import { TOKEN_TYPE } from 'src/utils/const.config'
import { uuidv7 } from 'uuidv7'

interface TokenCreationAttr {
	id?: string
	email: string
	token: string
	type: TOKEN_TYPE
	expiresAt: Date
}

@Table({ tableName: 'tokens' })
export class Token extends Model<Token, TokenCreationAttr> {
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
		primaryKey: true,
		allowNull: false,
	})
	email: string

	@Column({
		type: DataType.STRING,
		unique: true,
		allowNull: false,
	})
	token: string

	@Column({
		type: DataType.STRING, //DataType.ENUM(...Object.values(TokenType)),
		primaryKey: true,
		allowNull: false,
	})
	type: TOKEN_TYPE

	@Column({
		type: DataType.DATE,
		allowNull: false,
	})
	expiresAt: Date
}
