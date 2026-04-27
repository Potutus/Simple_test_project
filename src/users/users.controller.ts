import {
	Body,
	Get,
	Post,
	Delete,
	Controller,
	Header,
	Patch,
} from '@nestjs/common'
import { UsersService } from './users.service'
import { ApiOkResponse, ApiOperation } from '@nestjs/swagger'
import { GetAllUsers, LoginCheckResponse } from './types'
import { RoleDto } from './dto/role.dto'
import { ROLES } from 'src/utils/const.config'
import { Authorized } from 'src/auth/decorator/authorizaed.decorator'
import { Authorization } from 'src/auth/decorator/auth.decorator'
import { UpdateUserDto } from './dto/user.dto'

@Controller('users')
export class UsersController {
	constructor(private readonly usersService: UsersService) {}

	@ApiOperation({ summary: 'Проверить пользователя' })
	@ApiOkResponse({ type: LoginCheckResponse })
	@Get('/login-check')
	@Authorization()
	async loginCheck(@Authorized('id') userID: string) {
		return this.usersService.findOne({ where: { id: userID } })
	}

	@ApiOperation({ summary: 'Получить всех пользователей' })
	@ApiOkResponse({ type: GetAllUsers })
	@Get()
	@Authorization(ROLES.ADMIN)
	async getAllUsers() {
		return this.usersService.getAllUsers()
	}

	@ApiOperation({ summary: 'Добавить роль пользователю' })
	@Post('/role')
	@Authorization(ROLES.ADMIN)
	@Header('Content-type', 'application/json')
	async addRole(@Body() roleDto: RoleDto) {
		return this.usersService.addRole(roleDto)
	}

	@ApiOperation({ summary: 'Удалить роль у пользователя' })
	@Delete('/role')
	@Authorization(ROLES.ADMIN)
	async removeRole(@Body() roleDto: RoleDto) {
		return this.usersService.removeRole(roleDto)
	}

	@ApiOperation({ summary: 'Обновление данных профиля' })
	@Patch()
	@Authorization()
	async update(@Authorized('id') userID: string, @Body() dto: UpdateUserDto) {
		return this.usersService.update(userID, dto)
	}
}
