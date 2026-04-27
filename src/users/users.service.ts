import {
	BadRequestException,
	Injectable,
	InternalServerErrorException,
	NotFoundException,
} from '@nestjs/common'
import { InjectModel } from '@nestjs/sequelize'
import { AuthMethod, User } from './entities/users.model'
import { UpdateUserDto } from './dto/user.dto'
import { RolesService } from 'src/roles/roles.service'
import { RoleDto } from './dto/role.dto'
import { ROLES } from 'src/utils/const.config'
import { ArgonService } from 'src/auth/argon2/argon.service'
import { Transaction } from 'sequelize'

@Injectable()
export class UsersService {
	constructor(
		@InjectModel(User)
		private readonly userModel: typeof User,
		private readonly roleService: RolesService,
		private readonly argonService: ArgonService
	) {}

	async findOne({ ...filter }): Promise<User> {
		return await this.userModel.findOne({ ...filter })
	}

	async getAllUsers(): Promise<User[]> {
		const users = await this.userModel.findAll({
			include: {
				all: true,
				through: { attributes: [] },
			},
		})
		return users
	}

	async getOneUser(userID: string): Promise<User> {
		const user = this.userModel.findOne({
			where: {
				id: userID,
			},
			include: {
				all: true,
				through: { attributes: [] },
			},
		})

		return user
	}

	async createUser(
		email: string,
		username: string,
		password: string,
		method: AuthMethod,
		isVerifired: boolean,
		avatarPath?: string,
		transaction?: Transaction
	): Promise<User> {
		const role = await this.roleService.getRoleByValue(ROLES.USER)

		const hashedPassword = password
			? await this.argonService.hash(password)
			: ''

		const user = await this.userModel.create(
			{
				username: username,
				password: hashedPassword,
				email: email,
				method: method,
				isVerified: isVerifired,
			},
			{ transaction: transaction }
		)

		await user.$set('roles', [role?.id], { transaction: transaction })
		await user.$create(
			'profile',
			{
				avatarPath: avatarPath !== '' ? avatarPath : null,
			},
			{ transaction: transaction }
		)

		return user
	}

	async update(userID: string, updateUserDto: UpdateUserDto) {
		const user = await this.userModel.findByPk(userID)

		if (!user) {
			throw new NotFoundException('Пользователь не найден')
		}

		const updatedUser = await user
			.update({
				username: updateUserDto?.username,
				isTwoFactorEnabled: updateUserDto?.isTwoFactorEnabled,
			})
			.catch((e) => {
				throw new InternalServerErrorException(
					'При обновлении данных, что-то пошло не так'
				)
			})

		return updatedUser
	}

	async addRole(roleDto: RoleDto) {
		const user = await this.userModel.findByPk(roleDto.userID)
		const role = await this.roleService.getRoleByValue(roleDto.value)

		if (role && user) {
			await user.$add('role', role.id)
			return roleDto
		}

		throw new NotFoundException('Пользователь или роль не найдены')
	}

	async removeRole(RoleDto: RoleDto) {
		const user = await this.userModel.findByPk(RoleDto.userID)
		const role = await this.roleService.getRoleByValue(RoleDto.value)

		if (role && user) {
			await user.$remove('role', role.id)
			return RoleDto
		}

		throw new NotFoundException('Пользователь или роль не найдены')
	}
}
