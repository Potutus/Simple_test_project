import { Module, forwardRef } from '@nestjs/common'
import { RolesService } from './roles.service'
import { RolesController } from './roles.controller'
import { SequelizeModule } from '@nestjs/sequelize'
import { Role } from './entities/roles.model'
import { User } from 'src/users/entities/users.model'
import { UserRoles } from '../relationships/user-roles.model'
import { UsersService } from 'src/users/users.service'
import { ProfileService } from 'src/profile/profile.service'
import { Profile } from 'src/profile/entities/profile.model'
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
			Role,
			User,
			UserRoles,
			Profile,
			Media,
			Token,
			FileAttachment,
			FileStorage,
		]),
	],
	providers: [
		RolesService,
		UsersService,
		ProfileService,
		ArgonService,
		MediaService,
		FilesService,
		MediaTAService,
		FileManagerService,
		MailService,
	],
	controllers: [RolesController],
	exports: [RolesService],
})
export class RolesModule {}
