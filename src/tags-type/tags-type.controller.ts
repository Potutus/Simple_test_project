import {
	Body,
	Controller,
	Get,
	Post,
	UseGuards,
	UsePipes,
	ValidationPipe,
	Delete,
	Put,
} from '@nestjs/common'
import { TagsTypeService } from './tags-type.service'
import { ApiOperation } from '@nestjs/swagger'
import { Roles } from 'src/auth/decorator/roles.decorator'
import { ROLES } from 'src/utils/const.config'
import { AuthenticatedGuard } from 'src/auth/guard/authenticated.guard'
import { TagTypeDto, UpdateTagTypeDto } from './dto/tags-type.dto'
import { Authorization } from 'src/auth/decorator/auth.decorator'

@Controller('tags-type')
export class TagsTypeController {
	constructor(private tagTypeService: TagsTypeService) {}

	@ApiOperation({ summary: 'Создать тип тега' })
	@Post()
	@UsePipes(ValidationPipe)
	@Authorization(ROLES.ADMIN)
	create(@Body() tagTypeDto: TagTypeDto) {
		return this.tagTypeService.create(tagTypeDto)
	}

	@ApiOperation({ summary: 'Обновить тип тега' })
	@Put()
	@UsePipes(ValidationPipe)
	@Authorization(ROLES.ADMIN)
	update(@Body() tagTypeDto: UpdateTagTypeDto) {
		return this.tagTypeService.update(tagTypeDto)
	}

	@ApiOperation({ summary: 'Получить все теги' })
	@Get('all')
	getAll() {
		return this.tagTypeService.getAll()
	}

	@ApiOperation({ summary: 'Удалить тип тега' })
	@Delete()
	@UsePipes(ValidationPipe)
	@Authorization(ROLES.ADMIN)
	delete(@Body() tagTypeDto: TagTypeDto) {
		return this.tagTypeService.remove(tagTypeDto)
	}
}
