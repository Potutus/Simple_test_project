import { Module } from '@nestjs/common'
import { TagsTypeController } from './tags-type.controller'
import { TagsTypeService } from './tags-type.service'
import { SequelizeModule } from '@nestjs/sequelize'
import { TagsType } from './entities/tags-type.model'
import { UsersService } from 'src/users/users.service'
import { User } from 'src/users/entities/users.model'
import { RolesService } from 'src/roles/roles.service'
import { Role } from 'src/roles/entities/roles.model'
import { Profile } from 'src/profile/entities/profile.model'
import { ProfileService } from 'src/profile/profile.service'
import { Media } from 'src/media/entities/media.model'
import { ArgonService } from 'src/auth/argon2/argon.service'
import { MediaService } from 'src/media/media.service'
import { FilesService } from 'src/files/files.service'
import { MediaTAService } from 'src/media/media-action-tags.service'

import { MailService } from 'src/libs/mail/mail.service'
import { Token } from 'src/users/entities/token.model'
import { FileManagerService } from 'src/files/files-manager.service'
import { FileAttachment } from 'src/files/entities/file-attachment.model'
import { FileStorage } from 'src/files/entities/file-storage.model'

@Module({
	imports: [
		SequelizeModule.forFeature([
			TagsType,
			User,
			Role,
			Profile,
			Media,
			Token,
			FileAttachment,
			FileStorage,
		]),
	],
	controllers: [TagsTypeController],
	providers: [
		TagsTypeService,
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
})
export class TagsTypeModule {}
