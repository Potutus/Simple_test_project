import {
	BelongsToMany,
	Column,
	DataType,
	Index,
	Model,
	Table,
} from 'sequelize-typescript'
import { uuidv7 } from 'uuidv7'
import { FileSystemNode } from './file-system-node.model'
import { FSNodeTag } from './file-system-node-tag.model'

export interface FSTagCreateAttr {
	id?: string
	ownerID: string
	name: string
	description?: string
	color: string
	descripion?: string
	metadata?: Record<string, any>
}

@Table({
	tableName: 'fs_tags',
	indexes: [
		{
			name: 'ix_fs_tags_owner_name',
			fields: ['ownerID', 'name'],
			unique: true,
		},
	],
})
export class FSTags extends Model<FSTags, FSTagCreateAttr> {
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
		type: DataType.STRING,
		unique: false,
		allowNull: true,
	})
	color: string

	@Column({
		type: DataType.TEXT,
		unique: false,
		allowNull: true,
	})
	description: string

	@Column({
		type: DataType.JSONB,
		unique: false,
		allowNull: true,
	})
	metadata: Record<string, any>

	@BelongsToMany(() => FileSystemNode, () => FSNodeTag)
	fileSystemNodes: FileSystemNode[]
}
