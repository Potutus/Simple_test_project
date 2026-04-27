import {
	Table,
	Model,
	Column,
	DataType,
	ForeignKey,
	BelongsTo,
	Index,
} from 'sequelize-typescript'
import { v7 as uuidv7 } from 'uuid'
import { FileSystemNode } from './file-system-node.model'

export interface SmartFolderCreateAttr {
	id?: string
	nodeID: string
	ownerID: string
	query: Record<string, any>
	options?: Record<string, any>
}

@Table({ tableName: 'fs_smart_folder' })
export class FSSmartFolder extends Model<FSSmartFolder, SmartFolderCreateAttr> {
	@Column({
		type: DataType.UUID,
		unique: true,
		primaryKey: true,
		allowNull: false,
		defaultValue: uuidv7,
	})
	id: string

	@ForeignKey(() => FileSystemNode)
	@Index('ix_smart_folder_node')
	@Column({
		type: DataType.UUID,
		allowNull: false,
	})
	nodeID: string

	@BelongsTo(() => FileSystemNode)
	node: FileSystemNode

	@Index('ix_smart_folder_owner')
	@Column({
		type: DataType.UUID,
		allowNull: false,
	})
	ownerID: string

	@Column({
		type: DataType.JSONB,
		allowNull: false,
	})
	query: Record<string, any>

	@Column({
		type: DataType.JSONB,
		allowNull: false,
	})
	options: Record<string, any>
}
