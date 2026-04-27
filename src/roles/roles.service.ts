import {
	BadRequestException,
	Injectable,
	InternalServerErrorException,
} from '@nestjs/common'
import { CreateRoleDto } from './dto/role.dto'
import { InjectModel } from '@nestjs/sequelize'
import { Role } from './entities/roles.model'
import { ROLES, ROLES_DESCRIPTION } from 'src/utils/const.config'

@Injectable()
export class RolesService {
	constructor(
		@InjectModel(Role)
		private readonly roleModel: typeof Role
	) {}

	private async initializeRoles() {
		const roles = [...Object.values(ROLES)]

		const existingRoles = await this.roleModel.findAll({
			where: { value: roles },
			attributes: ['value'],
		})

		const existingRoleValues = new Set(existingRoles.map((role) => role.value))

		const rolesToCreate = roles.filter((role) => !existingRoleValues.has(role))

		if (rolesToCreate?.length > 0) {
			await this.roleModel.bulkCreate(
				rolesToCreate.map((value) => ({
					value: value,
					description: ROLES_DESCRIPTION[value],
				})),
				{
					ignoreDuplicates: true,
				}
			)
			console.log(`Созданы роли: ${rolesToCreate.join(', ')}`)
		}
	}

	async onModuleInit() {
		await this.initializeRoles()
	}

	async create(createRoleDto: CreateRoleDto): Promise<Role> {
		const role = await this.roleModel
			.create({
				value: createRoleDto.value.toUpperCase(),
				description: createRoleDto.description,
			})
			.catch((err) => {
				throw new BadRequestException('Неверные входные данные')
			})

		return role
	}

	async getRoleByValue(value: string): Promise<Role> {
		const role = await this.roleModel
			.findOne({
				attributes: ['id'],
				where: {
					value: value.toUpperCase(),
				},
			})
			.catch((e) => {
				throw new InternalServerErrorException('Роль не инициализирована')
			})

		return role
	}
}
