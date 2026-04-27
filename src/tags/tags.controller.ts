import {
	Controller,
	Post,
	Get,
	Delete,
	UseGuards,
	Body,
	UsePipes,
	Put,
} from '@nestjs/common'
import { TagsService } from './tags.service'
import { Roles } from 'src/auth/decorator/roles.decorator'
import { AuthenticatedGuard } from 'src/auth/guard/authenticated.guard'
import {
	AddTagTypeToTagDto,
	DeleteTagTypeFromTagDto,
	TagDto,
	UpdateTagDto,
} from './dto/tag.dto'
import { ApiOperation } from '@nestjs/swagger'
import { ValidationPipe } from 'src/pipes/validation.pipes'
import { ROLES } from 'src/utils/const.config'
import { Authorization } from 'src/auth/decorator/auth.decorator'

@Controller('tags')
export class TagsController {
	constructor(private tagService: TagsService) {}

	@ApiOperation({ summary: 'Создать тег' })
	@Post()
	@UsePipes(ValidationPipe)
	@Authorization(ROLES.ADMIN)
	create(@Body() tagDto: TagDto) {
		return this.tagService.create(tagDto)
	}

	@ApiOperation({ summary: 'Присвоить тип тега тегу' })
	@Post('tag-type')
	@UsePipes(ValidationPipe)
	@Authorization(ROLES.ADMIN)
	addTagType(@Body() addTagTypeDto: AddTagTypeToTagDto) {
		return this.tagService.addTagTypeToTag(addTagTypeDto)
	}

	@ApiOperation({ summary: 'Присвоить тип тега тегу' })
	@Delete('tag-type')
	@UsePipes(ValidationPipe)
	@Authorization(ROLES.ADMIN)
	deleteTagType(@Body() deleteTagTypeDto: DeleteTagTypeFromTagDto) {
		return this.tagService.deleteTagTypeFromTag(deleteTagTypeDto)
	}

	@ApiOperation({ summary: 'Получить все теги' })
	@Get('all')
	getAll() {
		return this.tagService.getAll()
	}

	@ApiOperation({ summary: 'Обновить тип тега' })
	@Put()
	@UsePipes(ValidationPipe)
	@Authorization(ROLES.ADMIN)
	update(@Body() tagDto: UpdateTagDto) {
		return this.tagService.update(tagDto)
	}

	@ApiOperation({ summary: 'Удалить тег' })
	@Delete()
	@UsePipes(ValidationPipe)
	@Authorization(ROLES.ADMIN)
	delete(@Body() tagDto: TagDto) {
		return this.tagService.remove(tagDto)
	}
}
