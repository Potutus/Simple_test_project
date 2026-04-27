import { Module } from '@nestjs/common'
import { UsersController } from './users.controller'
import { UsersService } from './users.service'
import { SequelizeModule } from '@nestjs/sequelize'
import { User } from './entities/users.model'
import { Role } from 'src/roles/entities/roles.model'
import { UserRoles } from 'src/relationships/user-roles.model'
import { Profile } from 'src/profile/entities/profile.model'
import { ProfileService } from 'src/profile/profile.service'
import { Media } from 'src/media/entities/media.model'
import { RolesService } from 'src/roles/roles.service'
import { ArgonService } from 'src/auth/argon2/argon.service'
import { ProfileModule } from 'src/profile/profile.module'
import { MediaService } from 'src/media/media.service'
import { FilesService } from 'src/files/files.service'
import { MediaTAService } from 'src/media/media-action-tags.service'
import { Token } from './entities/token.model'

import { MailService } from 'src/libs/mail/mail.service'
import { FileManagerService } from 'src/files/files-manager.service'
import { FileAttachment } from 'src/files/entities/file-attachment.model'
import { FileStorage } from 'src/files/entities/file-storage.model'

@Module({
	imports: [
		SequelizeModule.forFeature([
			User,
			Role,
			UserRoles,
			Profile,
			Media,
			Token,
			FileAttachment,
			FileStorage,
		]),
		ProfileModule,
	],
	controllers: [UsersController],
	providers: [
		UsersService,
		ProfileService,
		RolesService,
		ArgonService,
		MediaService,
		FilesService,
		MediaTAService,
		MailService,
		FileManagerService,
	],
	exports: [UsersService],
})
export class UsersModule {}
