import { Table, DataType, Model, Column } from 'sequelize-typescript'
import { uuidv7 } from 'uuidv7'

export enum FileTypes {
	VIDEO = 'VIDEO',
	AUDIO = 'AUDIO',
	IMAGE = 'IMAGE',
	DOCUMENT = 'DOCUMENT',
	OTHERS = 'OTHERS',
}

export enum FileStorageType {
	LOCAL = 'LOCAL',
	S3 = 'S3',
	IPFS = 'IPFS',
	AZURE = 'AZURE',
	GCS = 'GCS',
}

export enum FileLifeCycle {
	READY = 'READY',
	PENDING = 'PENDING',
	DELETING = 'DELETING',
	ERROR = 'ERROR',
}

export enum FileVirusScan {
	PENDING = 'PENDING',
	CLEAN = 'CLEAN',
	FLAGGED = 'FLAGGED',
}

interface FileStorageCreationAttr {
	id?: string
	name: string
	mimeType: string
	type: FileTypes
	size: bigint
	hash: string
	storageType: FileStorageType
	storagePath: string
	isTemporary?: boolean
	refCount?: number
	lifecycle?: FileLifeCycle
	virusScan?: FileVirusScan
	metadata?: Record<string, any>
}

@Table({ tableName: 'file_storage' })
export class FileStorage extends Model<FileStorage, FileStorageCreationAttr> {
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
		unique: true,
		allowNull: false,
	})
	name: string

	@Column({
		type: DataType.STRING,
		allowNull: false,
	})
	mimeType: string

	@Column({
		type: DataType.ENUM(...Object.values(FileTypes)),
		allowNull: false,
	})
	type: string

	@Column({
		type: DataType.BIGINT,
		allowNull: false,
		comment: 'Bytes',
	})
	size: bigint

	@Column({
		type: DataType.STRING(512),
		unique: true,
		allowNull: false,
	})
	hash: string

	@Column({
		type: DataType.ENUM(...Object.values(FileStorageType)),
		allowNull: false,
	})
	storageType: FileStorageType

	@Column({
		type: DataType.STRING(512),
		unique: true,
		allowNull: false,
	})
	storagePath: string

	@Column({
		type: DataType.BOOLEAN,
		defaultValue: false,
	})
	isTemporary: boolean

	//удалить!
	@Column({
		type: DataType.DATE,
		defaultValue: DataType.NOW,
	})
	lastUsedAt: Date

	@Column({
		type: DataType.BIGINT,
		defaultValue: 0,
	})
	refCount: number

	@Column({
		type: DataType.ENUM(...Object.values(FileLifeCycle)),
		allowNull: false,
		defaultValue: FileLifeCycle.PENDING,
	})
	lifecycle: FileLifeCycle

	@Column({
		type: DataType.ENUM(...Object.values(FileVirusScan)),
		allowNull: false,
		defaultValue: FileVirusScan.PENDING,
	})
	virusScan: FileVirusScan

	@Column({
		type: DataType.JSONB,
		allowNull: true,
	})
	metadata: Record<string, any>
}
