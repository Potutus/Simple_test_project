import {
	Table,
	Model,
	Column,
	DataType,
	ForeignKey,
	BelongsTo,
} from 'sequelize-typescript'
import { v7 as uuidv7 } from 'uuid'
import { Group } from './group.model'

export interface GroupRoleCreationAttr {
	id?: string
	groupID: string
	name: string
	description?: string
	mask?: bigint
}

@Table({
	tableName: 'group_roles',
	indexes: [
		{
			name: 'ix_group_role_owner_name',
			fields: ['groupID', 'name'],
			unique: true,
		},
	],
})
export class GroupRole extends Model<GroupRole, GroupRoleCreationAttr> {
	@Column({
		type: DataType.UUID,
		unique: true,
		primaryKey: true,
		allowNull: false,
		defaultValue: uuidv7,
	})
	id: string

	@ForeignKey(() => Group)
	@Column({
		type: DataType.UUID,
		allowNull: false,
	})
	groupID: string

	@BelongsTo(() => Group)
	group: Group

	@Column({
		type: DataType.STRING,
		allowNull: false,
	})
	name: string

	@Column(DataType.TEXT)
	description: string

	@Column({
		type: DataType.BIGINT,
		allowNull: false,
		defaultValue: 0,
	})
	mask: bigint
}
