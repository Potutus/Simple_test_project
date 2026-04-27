import {
	Table,
	Model,
	Column,
	DataType,
	ForeignKey,
	BelongsTo,
} from 'sequelize-typescript'
import { Group } from './group.model'
import { GroupRole } from './group-role.model'
import { uuidv7 } from 'uuidv7'

export enum GroupMemberStatus {
	ACTIVE = 'ACTIVE',
	PENDING = 'PENDING',
	REQUESTERD = 'REQUESTED',
}

export interface GroupMemberCreationAttr {
	groupID: string
	userID: string
	roleID?: string
	status?: GroupMemberStatus
}

@Table({
	tableName: 'group_member',
})
export class GroupMember extends Model<GroupMember, GroupMemberCreationAttr> {
	@ForeignKey(() => Group)
	@Column({
		type: DataType.UUID,
		allowNull: false,
		primaryKey: true,
	})
	groupID: string

	@BelongsTo(() => Group)
	group: Group

	@Column({
		type: DataType.UUID,
		allowNull: false,
		primaryKey: true,
	})
	userID: string

	@ForeignKey(() => GroupRole)
	@Column({
		type: DataType.UUID,
		allowNull: true,
	})
	roleID: string

	@BelongsTo(() => GroupRole)
	role: GroupRole

	@Column({
		type: DataType.ENUM(...Object.values(GroupMemberStatus)),
		allowNull: false,
		defaultValue: GroupMemberStatus.PENDING,
	})
	status: string
}
