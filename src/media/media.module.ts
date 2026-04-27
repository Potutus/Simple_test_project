import { Module } from '@nestjs/common'
import { MediaService } from './media.service'
import { MediaController } from './media.controller'
import { SequelizeModule } from '@nestjs/sequelize'
import { Media } from './entities/media.model'
import { Tags } from 'src/tags/entities/tags.model'
import { MediaTags } from 'src/relationships/media-tags.model'
import { UsersService } from 'src/users/users.service'
import { User } from 'src/users/entities/users.model'
import { RolesService } from 'src/roles/roles.service'
import { Role } from 'src/roles/entities/roles.model'
import { FilesService } from 'src/files/files.service'
import { TagsService } from 'src/tags/tags.service'
import { MediaTAService } from './media-action-tags.service'
import { ProfileService } from 'src/profile/profile.service'
import { Profile } from 'src/profile/entities/profile.model'
import { ArgonService } from 'src/auth/argon2/argon.service'
import { MediaRelationService } from './media-relation.service'

import { MailService } from 'src/libs/mail/mail.service'
import { Token } from 'src/users/entities/token.model'
import { FileManagerService } from 'src/files/files-manager.service'
import { FileAttachment } from 'src/files/entities/file-attachment.model'
import { FileStorage } from 'src/files/entities/file-storage.model'

@Module({
	imports: [
		SequelizeModule.forFeature([
			Media,
			Tags,
			MediaTags,
			User,
			Role,
			Profile,
			Token,
			FileAttachment,
			FileStorage,
		]),
	],
	providers: [
		MediaService,
		MediaRelationService,
		UsersService,
		RolesService,
		FilesService,
		TagsService,
		MediaTAService,
		ProfileService,
		ArgonService,
		FileManagerService,
		MailService,
	],
	controllers: [MediaController],
	exports: [MediaService],
})
export class MediaModule {}
