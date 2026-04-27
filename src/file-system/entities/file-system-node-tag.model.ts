import {
	Column,
	DataType,
	ForeignKey,
	Model,
	Table,
} from 'sequelize-typescript'
import { FSTags } from './file-system-tag.model'
import { FileSystemNode } from './file-system-node.model'

export interface FSNodeTagCreateAttr {
	tagID: string
	nodeID: string
}

@Table({ tableName: 'fs_node_tag' })
export class FSNodeTag extends Model<FSNodeTag, FSNodeTagCreateAttr> {
	@ForeignKey(() => FSTags)
	@Column({
		type: DataType.UUID,
		allowNull: false,
		primaryKey: true,
	})
	tagID: string

	@ForeignKey(() => FileSystemNode)
	@Column({
		type: DataType.UUID,
		allowNull: false,
		primaryKey: true,
	})
	nodeID: string
}
