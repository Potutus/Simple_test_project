import {
	Table,
	DataType,
	Model,
	Column,
	BelongsToMany,
	HasMany,
	ForeignKey,
	BelongsTo,
} from 'sequelize-typescript'
import {
	FileAttachment,
	OwnerType,
} from 'src/files/entities/file-attachment.model'
import { Favorite } from 'src/profile/entities/profile-favorite.model'
import { Profile } from 'src/profile/entities/profile.model'
import { MediaTags } from 'src/relationships/media-tags.model'
import { MediaRelated } from 'src/relationships/related-media.model'
import { Tags } from 'src/tags/entities/tags.model'
import { User } from 'src/users/entities/users.model'
import { uuidv7 } from 'uuidv7'

export enum MediaType {
	VIDEO = 'VIDEO',
	AUDIO = 'AUDIO',
	IMAGE = 'IMAGE',
}

export enum MediaVisibility {
	PUBLIC = 'PUBLIC',
	PRIVATE = 'PRIVATE',
	INTERNAL = 'INTERNAL',
	UNLISTED = 'UNLISTED',
}

export enum MediaStatus {
	READY = 'READY',
	PENDING = 'PENDING',
	FAILED = 'FAILED',
}

interface MediaCreationAttr {
	id: string
	name: string
	description?: string
	visibility: MediaVisibility
	ownerID: string
	type: MediaType
	status?: MediaStatus
	metadata?: Record<string, any>
}

@Table({
	tableName: 'media',
	indexes: [
		{
			name: 'ix_media_discovery',
			fields: ['visibility', 'type', 'id'],
			where: {
				visibility: MediaVisibility.PUBLIC,
				status: MediaStatus.READY,
			},
		},
		{
			name: 'ix_media_owner_feed',
			fields: ['ownerID', 'type', 'visibility', 'id'],
		},
	],
})
export class Media extends Model<Media, MediaCreationAttr> {
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
		validate: {
			notNull: {
				msg: 'Не должно быть пустым',
			},
		},
	})
	name: string

	@Column({
		type: DataType.TEXT,
		allowNull: true,
	})
	description: string

	@Column({
		type: DataType.ENUM(...Object.values(MediaVisibility)),
		allowNull: false,
		defaultValue: MediaVisibility.PRIVATE,
	})
	visibility: MediaVisibility

	@Column({
		type: DataType.ENUM(...Object.values(MediaType)),
		allowNull: false,
	})
	type: MediaType

	@Column({
		type: DataType.ENUM(...Object.values(MediaStatus)),
		allowNull: false,
		defaultValue: MediaStatus.PENDING,
	})
	status: MediaStatus

	@Column({
		type: DataType.JSONB,
		allowNull: true,
	})
	metadata: Record<string, any>

	@ForeignKey(() => User)
	@Column({
		type: DataType.UUID,
		allowNull: false,
	})
	ownerID: string

	@BelongsTo(() => User)
	owner: User

	@HasMany(() => FileAttachment, {
		foreignKey: 'ownerID',
		constraints: false,
		scope: {
			ownerType: OwnerType.MEDIA,
		},
	})
	attachments: FileAttachment[]

	@BelongsToMany(() => Tags, () => MediaTags)
	tags: Tags[]

	@BelongsToMany(() => Media, () => MediaRelated, 'mediaID', 'relatedMediaID')
	relatedMedia: Media[]

	@BelongsToMany(() => Profile, () => Favorite)
	favoritedByProfiles: Profile[]
}
