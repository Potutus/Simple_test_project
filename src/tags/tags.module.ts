import { Module } from '@nestjs/common'
import { TagsService } from './tags.service'
import { TagsController } from './tags.controller'
import { SequelizeModule } from '@nestjs/sequelize'
import { Tags } from './entities/tags.model'
import { MediaTags } from '../relationships/media-tags.model'
import { Media } from 'src/media/entities/media.model'
import { UsersService } from 'src/users/users.service'
import { RolesService } from 'src/roles/roles.service'
import { User } from 'src/users/entities/users.model'
import { Role } from 'src/roles/entities/roles.model'
import { ProfileService } from 'src/profile/profile.service'
import { Profile } from 'src/profile/entities/profile.model'
import { ArgonService } from 'src/auth/argon2/argon.service'
import { MediaService } from 'src/media/media.service'
import { FilesService } from 'src/files/files.service'
import { MediaTAService } from 'src/media/media-action-tags.service'

import { MailService } from 'src/libs/mail/mail.service'
import { Token } from 'src/users/entities/token.model'
import { FileStorage } from 'src/files/entities/file-storage.model'
import { FileAttachment } from 'src/files/entities/file-attachment.model'
import { FileManagerService } from 'src/files/files-manager.service'

@Module({
	imports: [
		SequelizeModule.forFeature([
			Tags,
			Media,
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
		TagsService,
		UsersService,
		RolesService,
		ProfileService,
		ArgonService,
		MediaService,
		FilesService,
		MediaTAService,
		FileManagerService,
		MailService,
	],
	controllers: [TagsController],
})
export class TagsModule {}
