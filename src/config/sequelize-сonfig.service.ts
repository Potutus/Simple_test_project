import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import {
	SequelizeOptionsFactory,
	SequelizeModuleOptions,
} from '@nestjs/sequelize'
import { Media } from 'src/media/entities/media.model'
import { Profile } from 'src/profile/entities/profile.model'
import { Role } from 'src/roles/entities/roles.model'
import { UserRoles } from 'src/relationships/user-roles.model'
import { MediaTags } from 'src/relationships/media-tags.model'
import { Tags } from 'src/tags/entities/tags.model'
import { User } from 'src/users/entities/users.model'
import { Wiki } from 'src/wiki/entities/wiki.model'
import { TagsType } from 'src/tags-type/entities/tags-type.model'
import { Tags_TagsType } from 'src/relationships/tags-tagsType.model'
import { WikiGallery } from 'src/wiki/entities/wiki-gallery.model'
import { WikiContent } from 'src/wiki/entities/wiki-content.model'
import { WikiChar } from 'src/wiki/entities/wiki-char.model'
import { Album } from 'src/profile/entities/album.model'
import { Favorite } from 'src/profile/entities/profile-favorite.model'
import { AlbumMedia } from 'src/relationships/album-media.model'
import { WikiTags } from 'src/relationships/wiki-tags.model'
import { WikiGalleryMedia } from 'src/relationships/wikiGallery_media.model'
import { MediaRelated } from 'src/relationships/related-media.model'
import { Dialect } from 'sequelize'
import { parseBoolean } from 'src/libs/common/utils/parse-boolean.utils'
import { Account } from 'src/users/entities/accounts.model'
import { Token } from 'src/users/entities/token.model'
import { FileStorage } from 'src/files/entities/file-storage.model'
import { FileAttachment } from 'src/files/entities/file-attachment.model'
import { Group } from 'src/groups/entities/group.model'
import { GroupMember } from 'src/groups/entities/group-member.model'
import { GroupRole } from 'src/groups/entities/group-role.model'
import { FileSystemNode } from 'src/file-system/entities/file-system-node.model'
import { FSACL } from 'src/file-system/entities/file-system-acl.mode'
import { FSQuotaUsage } from 'src/file-system/entities/fs-quota-usage.model'
import { FSTags } from 'src/file-system/entities/file-system-tag.model'
import { FSNodeTag } from 'src/file-system/entities/file-system-node-tag.model'
import { AccessControlEntry } from 'src/access-control/entities/acl.model'
import { FileSystemDeletionTask } from 'src/file-system/entities/file-system-deletion-task.model'
import { ACEOutboxTask } from 'src/access-control/entities/acl-outbox-task.model'

@Injectable()
export class SequelizeConfigService implements SequelizeOptionsFactory {
	constructor(private readonly configService: ConfigService) {}

	createSequelizeOptions(): SequelizeModuleOptions {
		const dialect =
			<Dialect>this.configService.getOrThrow<string>('DB_DIALECT') || 'postgres'
		const logging =
			parseBoolean(this.configService.getOrThrow('DB_LOGGING')) || false
		const host = this.configService.getOrThrow<string>('DB_HOST')
		const port = +this.configService.getOrThrow<number>('DB_PORT')
		const username = this.configService.getOrThrow<string>('DB_USER')
		const password = this.configService.getOrThrow<string>('DB_PASSWORD')
		const database = this.configService.getOrThrow<string>('DB_NAME')
		const autoLoadEntities = true
		const synchronize = true

		return {
			dialect,
			logging,
			host,
			port,
			username,
			password,
			database,
			models: [
				User,
				Role,
				UserRoles,
				Tags,
				TagsType,
				Tags_TagsType,
				FileStorage,
				FileAttachment,
				Media,
				MediaTags,
				MediaRelated,
				Profile,
				Account,
				Token,
				Album,
				AlbumMedia,
				Favorite,
				Wiki,
				WikiTags,
				WikiGallery,
				WikiGalleryMedia,
				WikiContent,
				WikiChar,
				Group,
				GroupMember,
				GroupRole,
				FileSystemNode,
				FSACL,
				FSQuotaUsage,
				FSTags,
				FSNodeTag,
				AccessControlEntry,
				FileSystemDeletionTask,
				ACEOutboxTask,
			],
			autoLoadModels: autoLoadEntities,
			synchronize: synchronize,
			define: {
				charset: 'utf8',
				collate: 'utf8_general_ci',
			},
		}
	}
}
