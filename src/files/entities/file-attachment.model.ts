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
import { FileStorage } from './file-storage.model'

export enum OwnerType {
	MEDIA = 'MEDIA',
	AVATAR = 'AVATAR',
	WIKI_PAGE = 'WIKI_PAGE',
	POST = 'POST',
	COMMENT = 'COMMENT',
	FS_NODES = 'FS_NODES',
}

export enum FilePurpose {
	ORIGINAL = 'ORIGINAL',
	THUMBNAIL = 'THUMBNAIL',
	AVATAR = 'AVATAR',
}

interface FileAttachmentCreationAttr {
	id?: string
	fileID: string
	ownerType: string
	ownerID: string
	purpose?: string
	metadata?: Record<string, any>
}

@Table({ tableName: 'file_attachment' })
export class FileAttachment extends Model<
	FileAttachment,
	FileAttachmentCreationAttr
> {
	@Column({
		type: DataType.UUID,
		unique: true,
		primaryKey: true,
		allowNull: false,
		defaultValue: uuidv7,
	})
	id: string

	@ForeignKey(() => FileStorage)
	@Column({
		type: DataType.UUID,
		allowNull: false,
	})
	fileID: string

	@BelongsTo(() => FileStorage)
	file: FileStorage

	@Index('ix_owner')
	@Column({
		type: DataType.STRING(64),
		allowNull: false,
	})
	ownerType: OwnerType

	@Index('ix_owner')
	@Column({
		type: DataType.UUID,
		allowNull: false,
	})
	ownerID: string

	@Column({
		type: DataType.STRING(64),
		allowNull: true,
		defaultValue: FilePurpose.ORIGINAL,
	})
	purpose: string

	@Column({
		type: DataType.JSONB,
		allowNull: true,
	})
	metadata: Record<string, any>
}
