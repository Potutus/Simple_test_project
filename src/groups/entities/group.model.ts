import { Table, Model, Column, DataType, Index } from 'sequelize-typescript'
import { v7 as uuidv7 } from 'uuid'

export interface GroupCreationAttr {
	id?: string
	ownerID: string
	name: string
	description?: string
	metadata?: Record<string, any>
}

@Table({
	tableName: 'group',
	indexes: [
		{
			name: 'ix_group_owner_name',
			fields: ['ownerID', 'name'],
			unique: true,
		},
	],
})
export class Group extends Model<Group, GroupCreationAttr> {
	@Column({
		type: DataType.UUID,
		unique: true,
		primaryKey: true,
		allowNull: false,
		defaultValue: uuidv7,
	})
	id: string

	@Column({
		type: DataType.UUID,
		allowNull: false,
	})
	ownerID: string

	@Column({
		type: DataType.STRING,
		allowNull: false,
	})
	name: string

	@Column({
		type: DataType.TEXT,
		allowNull: true,
	})
	description: string

	@Column({
		type: DataType.JSONB,
		allowNull: true,
	})
	metadata: Record<string, any>
}
