import {
	Table,
	DataType,
	Model,
	Column,
	BelongsTo,
	HasMany,
	ForeignKey,
	BelongsToMany,
} from 'sequelize-typescript'
import { uuidv7 } from 'uuidv7'
import { FSTags } from './file-system-tag.model'
import { FSNodeTag } from './file-system-node-tag.model'
import { Op } from 'sequelize'

export enum FSMetadataCategoryType {
	NOT_SYSTEM = 'null',
}

export enum FSNodeType {
	FILE = 'FILE',
	FOLDER = 'FOLDER',
	NOTE = 'NOTE',
}

export enum FSLinkType {
	MEDIA = 'MEDIA',
	FSNODE = 'FSNODE',
}

export enum FSSystemDomain {
	ROOT = 'ROOT',
	VIDEO = 'VIDEO',
	AUDIO = 'AUDIO',
	IMAGE = 'IMAGE',
}

export enum FSSystemTag {
	ROOT = 'ROOT',
	TRASH = 'TRASH',
	SHARED = 'SHARED',

	DOMAIN = 'DOMAIN',

	ALBUMS = 'ALBUMS',
	ALBUM = 'ALBUM',
	FAVORITES = 'FAVORITES',
}

export interface FSMetadataType {
	link?: {
		category?: string
		type: string
		id: string
	}
	trash?: {
		oldPath: string
		oldName: string
	}
}

export interface FileSystemCreationAttr {
	id?: string
	ownerID: string
	parentID?: string
	systemTag: FSSystemTag
	systemDomain: FSSystemDomain
	nodeType: FSNodeType
	isSystem: boolean
	isSmart: boolean
	isLink: boolean
	isInherit: boolean
	name: string
	description?: string
	sortKey: string
	sizeCache?: bigint
	mimeCache?: string
	metadata?: FSMetadataType
	content?: string
	mediaID?: string
}

@Table({
	tableName: 'fs_node',
	indexes: [
		{
			name: 'ix_fs_children',
			fields: ['ownerID', 'parentID'],
			where: {
				deletedAt: null,
			},
		},
		{
			name: 'ix_fs_parent_sort',
			fields: ['ownerID', 'parentID', 'sortKey'],
			where: {
				deletedAt: null,
			},
		},
		{
			name: 'ix_fs_deleted_node',
			fields: ['deletedAt'],
			where: {
				deletedAt: {
					[Op.not]: null,
				},
			},
		},
		{
			name: 'ix_fs_system_tag',
			unique: true,
			fields: ['ownerID', 'systemTag', 'systemDomain', 'name'],
		},
		{
			name: 'ix_fs_cursor',
			fields: ['ownerID', 'parentID', 'id'],
		},
	],
})
export class FileSystemNode extends Model<
	FileSystemNode,
	FileSystemCreationAttr
> {
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

	@ForeignKey(() => FileSystemNode)
	@Column({
		type: DataType.UUID,
		allowNull: true,
	})
	parentID: string

	@BelongsTo(() => FileSystemNode, { foreignKey: 'parentID' })
	parent: FileSystemNode

	@HasMany(() => FileSystemNode, { foreignKey: 'parentID' })
	children: FileSystemNode[]

	@Column({
		type: DataType.ENUM(...Object.values(FSSystemTag)),
		allowNull: true,
		defaultValue: null,
	})
	systemTag: FSSystemTag

	@Column({
		type: DataType.ENUM(...Object.values(FSSystemDomain)),
		allowNull: true,
		defaultValue: null,
		comment: `Сфера для системных папок (${Object.values(FSSystemDomain)})`,
	})
	systemDomain: FSSystemDomain

	@Column({
		type: DataType.STRING(128),
		allowNull: false,
	})
	nodeType: FSNodeType

	@Column({
		type: DataType.BOOLEAN,
		defaultValue: false,
		allowNull: false,
	})
	isSystem: boolean

	@Column({
		type: DataType.BOOLEAN,
		defaultValue: false,
		allowNull: false,
	})
	isSmart: boolean

	@Column({
		type: DataType.BOOLEAN,
		defaultValue: false,
		allowNull: false,
	})
	isLink: boolean

	@Column({
		type: DataType.BOOLEAN,
		defaultValue: true,
		allowNull: false,
	})
	isInherit: boolean

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
		type: DataType.STRING(32),
		allowNull: false,
	})
	sortKey: string

	@Column({
		type: DataType.STRING,
		defaultValue: null,
		allowNull: true,
	})
	mimeCache: string

	@Column({
		type: DataType.BIGINT,
		allowNull: false,
		defaultValue: 0,
		comment: 'Bytes',
	})
	sizeCache: bigint

	@Column({
		type: DataType.JSONB,
		allowNull: true,
	})
	metadata: FSMetadataType

	@Column({
		type: DataType.TEXT,
		allowNull: true,
	})
	content: string

	@Column({
		type: DataType.DATE,
		defaultValue: null,
		allowNull: true,
	})
	deletedAt: Date

	@BelongsToMany(() => FSTags, () => FSNodeTag)
	fsTags: FSTags[]
}
