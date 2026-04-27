import {
	Table,
	Model,
	Column,
	DataType,
	ForeignKey,
	BelongsTo,
} from 'sequelize-typescript'
import { FileSystemNode } from './file-system-node.model'
import { uuidv7 } from 'uuidv7'

export enum FSGranteeType {
	USER = 'USER',
	GROUP = 'GROUP',
	GROUP_ROLE = 'GROUP_ROLE',
}

export interface FSACLCreateAttr {
	nodeID: string
	granteeType: FSGranteeType
	granteeID: string
	allowMask?: bigint
	denyMask?: bigint
}

@Table({
	tableName: 'fs_acl',
	// indexes: [
	// 	{
	// 		name: 'ix_fs_acl_ndID_grID_grType',
	// 		fields: ['nodeID', 'granteeID', 'granteeType'],
	// 		unique: true,
	// 	},
	// ],
})
export class FSACL extends Model<FSACL, FSACLCreateAttr> {
	@ForeignKey(() => FileSystemNode)
	@Column({
		type: DataType.UUID,
		allowNull: false,
		primaryKey: true,
	})
	nodeID: string

	@BelongsTo(() => FileSystemNode)
	node: FileSystemNode

	@Column({
		type: DataType.ENUM(...Object.values(FSGranteeType)),
		allowNull: false,
		primaryKey: true,
	})
	granteeType: FSGranteeType

	@Column({
		type: DataType.UUID,
		allowNull: false,
		primaryKey: true,
	})
	granteeID: string

	@Column({
		type: DataType.BIGINT,
		defaultValue: 0,
	})
	allowMask: bigint

	@Column({
		type: DataType.BIGINT,
		defaultValue: 0,
	})
	denyMask: bigint

	@Column({
		type: DataType.DATE,
		allowNull: true,
		comment:
			'Если дата прошла, доступ считается закрытым. null - вечный доступ',
	})
	expiresAt: Date
}
