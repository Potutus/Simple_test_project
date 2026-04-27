import { Column, DataType, Index, Model, Table } from 'sequelize-typescript'
import { uuidv7 } from 'uuidv7'

export enum MediaCollectionType {
	IMAGE_ALBUM = 'IMAGE_ALBUM',
	VIDEO_PLAYLIST = 'VIDEO_PLAYLIST',
	AUDIO_PLAYLIST = 'AUDIO_PLAYLIST',
}

export enum MediaCollectionVisibility {
	PUBLIC = 'PUBLIC',
	UNLISTED = 'UNLISTED',
}

export interface MediaColletionCreateAttr {
	id?: string
	ownerID: string
	title: string
	description?: string
	type: MediaCollectionType
	visibility: MediaCollectionVisibility
	metadata?: Record<string, any>
}

@Table({ tableName: 'media_collection' })
export class MediaCollection extends Model<MediaCollection> {
	@Column({
		type: DataType.UUID,
		unique: true,
		primaryKey: true,
		allowNull: false,
		defaultValue: uuidv7,
	})
	id: string

	@Index('ix_mc_owner')
	@Column({
		type: DataType.UUID,
		allowNull: false,
	})
	ownerID: string

	@Column({
		type: DataType.STRING,
		allowNull: false,
	})
	title: string

	@Column({
		type: DataType.TEXT,
		allowNull: true,
	})
	description: string

	@Column({
		type: DataType.STRING,
		allowNull: false,
	})
	type: MediaCollectionType

	@Column({
		type: DataType.STRING,
		allowNull: false,
		defaultValue: MediaCollectionVisibility.UNLISTED,
	})
	visibility: MediaCollectionVisibility

	@Column({
		type: DataType.JSONB,
		allowNull: true,
	})
	metadata: Record<string, any>
}
