import {
	Controller,
	Post,
	UseInterceptors,
	Body,
	UseGuards,
	Get,
	Param,
	UsePipes,
	Delete,
	UploadedFiles,
	Put,
} from '@nestjs/common'
import { MediaService } from './media.service'
import { FilesInterceptor } from '@nestjs/platform-express'
import { ApiOperation } from '@nestjs/swagger'
import { Roles } from 'src/auth/decorator/roles.decorator'
import { AuthenticatedGuard } from 'src/auth/guard/authenticated.guard'
import { ValidationPipe } from 'src/pipes/validation.pipes'
import { MediaTAService } from './media-action-tags.service'
import {
	GetMediasDto,
	RemoveMediaDto,
	MediaDto,
	UpdateMediasDto,
	AddMediaRelationDto,
	RemoveMediaRelationDto,
} from './dto/media.dto'
import { ROLES } from 'src/utils/const.config'
import { FileValidationPipe } from 'src/pipes/file-validation.pipe'
import { MediaRelationService } from './media-relation.service'
import { Authorized } from 'src/auth/decorator/authorizaed.decorator'
import { Authorization } from 'src/auth/decorator/auth.decorator'

@Controller('media')
export class MediaController {
	constructor(
		private mediaService: MediaService,
		private mediaTAService: MediaTAService,
		private mediaRealtionService: MediaRelationService
	) {}

	@ApiOperation({ summary: 'Создать медиа файл' })
	@Post()
	@UsePipes(ValidationPipe)
	@Authorization(ROLES.ADMIN)
	@UseInterceptors(FilesInterceptor('medias'))
	create(
		@Authorized('id') userID: string,
		@Body() createMediaDto: MediaDto,
		@UploadedFiles(
			new FileValidationPipe({
				required: true,
				fileType: 'MEDIA',
				fileCount: 'MEDIUM',
				fileSize: 'MEDIUM',
			})
		)
		medias: Array<Express.Multer.File>
	) {
		return this.mediaService.createMany(createMediaDto, medias, userID)
	}

	@ApiOperation({ summary: 'Обновить данные медиа' })
	@Put()
	@UsePipes(ValidationPipe)
	@Authorization(ROLES.ADMIN)
	update(@Body() updateMediasDto: UpdateMediasDto) {
		return this.mediaService.update(updateMediasDto)
	}

	@ApiOperation({ summary: 'Удалить медиа файл' })
	@Delete()
	@UsePipes(ValidationPipe)
	@Authorization(ROLES.ADMIN)
	remove(@Body() removeMediaDto: RemoveMediaDto) {
		return this.mediaService.remove(removeMediaDto)
	}

	@ApiOperation({ summary: 'Добавить тег медиа файлу' })
	@Post('/tag')
	@UsePipes(ValidationPipe)
	@Authorization(ROLES.ADMIN)
	addTag(@Body() mediaTagsDto: MediaDto) {
		return this.mediaTAService.addTagsToMedias(mediaTagsDto)
	}

	@ApiOperation({ summary: 'Удалить тег медиа файла' })
	@Delete('/tag')
	@UsePipes(ValidationPipe)
	@Authorization(ROLES.ADMIN)
	removeTag(@Body() mediaTagsDto: MediaDto) {
		return this.mediaTAService.removeTagsFromMedias(mediaTagsDto)
	}

	@ApiOperation({ summary: 'Получить медиа файл' })
	@Get('/one/:name')
	getOne(@Param('name') name: string) {
		return this.mediaService.getOne(name)
	}

	@ApiOperation({ summary: 'Получить все медиа файлы' })
	@Get('/all')
	@UsePipes(ValidationPipe)
	getAll(@Body() mediaFilterDto: MediaDto) {
		return this.mediaService.getAll(mediaFilterDto)
	}

	@ApiOperation({ summary: 'Получить некоторые медиа файлы' })
	@Get('/some')
	@UsePipes(ValidationPipe)
	getSome(@Body() getMediasDto: GetMediasDto) {
		return this.mediaService.getSome(getMediasDto)
	}

	@ApiOperation({ summary: 'Создать связь медиа с медиа' })
	@Post('/media-relation')
	@Authorization(ROLES.ADMIN)
	addMediaRelation(@Body() addMediaRelationDto: AddMediaRelationDto) {
		return this.mediaRealtionService.add(addMediaRelationDto)
	}

	@ApiOperation({ summary: 'Удалить связь медиа с медиа' })
	@Delete('/media-relation')
	@Authorization(ROLES.ADMIN)
	removeMediaRelation(@Body() removeMediaRelationDto: RemoveMediaRelationDto) {
		return this.mediaRealtionService.remove(removeMediaRelationDto)
	}
}
