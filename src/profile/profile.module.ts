import { Module } from '@nestjs/common'
import { ProfileController } from './profile.controller'
import { ProfileService } from './profile.service'
import { SequelizeModule } from '@nestjs/sequelize'
import { User } from 'src/users/entities/users.model'
import { Profile } from './entities/profile.model'
import { UsersService } from 'src/users/users.service'
import { RolesService } from 'src/roles/roles.service'
import { Role } from 'src/roles/entities/roles.model'
import { Media } from 'src/media/entities/media.model'
import { ArgonService } from 'src/auth/argon2/argon.service'
import { Favorite } from './entities/profile-favorite.model'
import { Album } from './entities/album.model'
import { FavoriteService } from './favorite/profile-favorite.service'
import { AlbumService } from './album/profile-album.service'
import { FilesService } from 'src/files/files.service'
import { MediaService } from 'src/media/media.service'
import { MediaTAService } from 'src/media/media-action-tags.service'

import { Token } from 'src/users/entities/token.model'
import { MailService } from 'src/libs/mail/mail.service'
import { FileManagerService } from 'src/files/files-manager.service'
import { FileStorage } from 'src/files/entities/file-storage.model'
import { FileAttachment } from 'src/files/entities/file-attachment.model'

@Module({
	imports: [
		SequelizeModule.forFeature([
			User,
			Profile,
			Role,
			Media,
			Favorite,
			Album,
			Token,
			FileAttachment,
			FileStorage,
		]),
	],
	controllers: [ProfileController],
	providers: [
		MediaService,
		MediaTAService,
		FilesService,
		ProfileService,
		UsersService,
		RolesService,
		ArgonService,
		FavoriteService,
		AlbumService,
		FileManagerService,
		MailService,
	],
})
export class ProfileModule {}
