import {
	Controller,
	Post,
	Body,
	Get,
	Param,
	UsePipes,
	UseGuards,
	ValidationPipe,
} from '@nestjs/common'
import { RolesService } from './roles.service'
import { CreateRoleDto } from './dto/role.dto'
import { Roles } from 'src/auth/decorator/roles.decorator'
import { AuthenticatedGuard } from 'src/auth/guard/authenticated.guard'
import { ApiOperation } from '@nestjs/swagger'
import { ROLES } from 'src/utils/const.config'
import { Authorization } from 'src/auth/decorator/auth.decorator'

@Controller('roles')
export class RolesController {
	constructor(private roleService: RolesService) {}

	@ApiOperation({ summary: 'Создать роль' })
	@Post()
	@UsePipes(ValidationPipe)
	@Authorization(ROLES.ADMIN)
	create(@Body() createRoleDto: CreateRoleDto) {
		return this.roleService.create(createRoleDto)
	}

	@ApiOperation({ summary: 'Получить роль' })
	@Get('/:value')
	@Authorization(ROLES.ADMIN)
	getByValue(@Param('value') value: string) {
		return this.roleService.getRoleByValue(value)
	}
}
