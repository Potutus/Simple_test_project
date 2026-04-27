import {
	Controller,
	Post,
	UseGuards,
	UsePipes,
	Request,
	Body,
	Delete,
	Get,
	Put,
	UploadedFiles,
	UseInterceptors,
} from '@nestjs/common'
import { ProfileService } from './profile.service'
import { ApiOperation } from '@nestjs/swagger'
import { ValidationPipe } from 'src/pipes/validation.pipes'
import { AuthenticatedGuard } from 'src/auth/guard/authenticated.guard'
import {
	AddMediaToAlbumDto,
	CreateAlbumDto,
	DeleteAlbumDto,
	DeleteFromAlbumDto,
	GetAlbumMediaDto,
	GetAlbumsDto,
	UpdateAlbumDto,
} from './dto/album.dto'
import { FavoriteService } from './favorite/profile-favorite.service'
import { AlbumService } from './album/profile-album.service'
import {
	GetFavoritesDto,
	RemoveFromFavoritesDto,
	AddToFavoritesDto,
} from './dto/favorite.dto'
import { UploadAvatarDto } from './dto/profile.dto'
import { FileValidationPipe } from 'src/pipes/file-validation.pipe'
import { FilesInterceptor } from '@nestjs/platform-express'
import { Authorization } from 'src/auth/decorator/auth.decorator'

@Controller('profile')
export class ProfileController {
	constructor(
		private readonly profileService: ProfileService,
		private readonly favoriteService: FavoriteService,
		private readonly albumService: AlbumService
	) {}

	@ApiOperation({ summary: 'Создать альбом' })
	@Get('/album')
	@UsePipes(ValidationPipe)
	@Authorization()
	getAlbum(@Request() req: { user: any }, @Body() getAlbumsDto: GetAlbumsDto) {
		return this.albumService.getAlbumsByProfile(
			getAlbumsDto,
			req.user.profileId
		)
	}

	@ApiOperation({ summary: 'Создать альбом' })
	@Put('/album')
	@UsePipes(ValidationPipe)
	@Authorization()
	updateAlbum(
		@Request() req: { user: any },
		@Body() updateAlbumDto: UpdateAlbumDto
	) {
		return this.albumService.update(updateAlbumDto, req.user.profileId)
	}

	@ApiOperation({ summary: 'Создать альбом' })
	@Post('/album')
	@UsePipes(ValidationPipe)
	@Authorization()
	addAlbum(
		@Request() req: { user: any },
		@Body() createAlbumDto: CreateAlbumDto
	) {
		return this.albumService.create(createAlbumDto, req.user.profileId)
	}

	@ApiOperation({ summary: 'Удалить альбом' })
	@Delete('/album')
	@UsePipes(ValidationPipe)
	@Authorization()
	removeAlbum(
		@Request() req: { user: any },
		@Body() removeAlbumDto: DeleteAlbumDto
	) {
		return this.albumService.delete(removeAlbumDto, req.user.profileId)
	}

	@ApiOperation({ summary: 'Добавить в альбом' })
	@Post('/to-album')
	@UsePipes(ValidationPipe)
	@Authorization()
	addToAlbum(
		@Request() req: { user: any },
		@Body() addToAlbumDto: AddMediaToAlbumDto
	) {
		return this.albumService.addMediaToAlbum(addToAlbumDto, req.user.profileId)
	}

	@ApiOperation({ summary: 'Удалить из альбом' })
	@Delete('/from-album')
	@UsePipes(ValidationPipe)
	@Authorization()
	removeFromAlbum(
		@Request() req: { user: any },
		@Body() deleteFromAlbumDto: DeleteFromAlbumDto
	) {
		return this.albumService.deleteFromAlbum(
			deleteFromAlbumDto,
			req.user.profileId
		)
	}

	@ApiOperation({ summary: 'Получить медиа из альбома' })
	@Get('/album-media')
	@UsePipes(ValidationPipe)
	@Authorization()
	changeParamAlbum(
		@Request() req: { user: any },
		@Body() GetAlbumMediaDto: GetAlbumMediaDto
	) {
		return this.albumService.getAlbumMedia(GetAlbumMediaDto, req.user.profileId)
	}

	@ApiOperation({ summary: 'Получить из избранного' })
	@Get('/favorite')
	@UsePipes(ValidationPipe)
	@Authorization()
	getFavorites(
		@Request() req: { user: any },
		@Body() getFavoritesDto: GetFavoritesDto
	) {
		return this.favoriteService.getFavoritesByProfile(
			getFavoritesDto,
			req.user.profileId
		)
	}

	@ApiOperation({ summary: 'Добавить в избранное' })
	@Post('/favorite')
	@UsePipes(ValidationPipe)
	@Authorization()
	addFavorite(
		@Request() req: { user: any },
		@Body() addFavoriteDto: AddToFavoritesDto
	) {
		return this.favoriteService.addToFavorites(
			addFavoriteDto,
			req.user.profileId
		)
	}

	@ApiOperation({ summary: 'Удалить из избранного' })
	@Delete('/favorite')
	@UsePipes(ValidationPipe)
	@Authorization()
	removeFavorite(
		@Request() req: { user: any },
		@Body() removeFavoriteDto: RemoveFromFavoritesDto
	) {
		return this.favoriteService.removeFromFavorites(
			removeFavoriteDto,
			req.user.profileId
		)
	}

	@ApiOperation({ summary: 'Обновить аватар' })
	@Put('/avatar')
	@UsePipes(ValidationPipe)
	@Authorization()
	@UseInterceptors(FilesInterceptor('avatarFile'))
	updateAvatar(
		@Request() req: { user: any },
		@Body() uploadAvatarDto: UploadAvatarDto,
		@UploadedFiles(
			new FileValidationPipe({
				required: false,
				fileType: 'AVATAR',
				fileCount: 'MEDIUM',
				fileSize: 'MEDIUM',
			})
		)
		avatarFile?: Array<Express.Multer.File>
	) {
		const profilePicture = avatarFile?.length ? avatarFile[0] : null

		return this.profileService.updateProfileAvatar(
			uploadAvatarDto,
			profilePicture,
			req.user.profileId
		)
	}
}
