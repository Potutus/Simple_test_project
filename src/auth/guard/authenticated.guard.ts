import {
	CanActivate,
	ExecutionContext,
	Injectable,
	InternalServerErrorException,
	UnauthorizedException,
} from '@nestjs/common'
import { Request } from 'express'
import { Profile } from 'src/profile/entities/profile.model'
import { Role } from 'src/roles/entities/roles.model'
import { UsersService } from 'src/users/users.service'

@Injectable()
export class AuthenticatedGuard implements CanActivate {
	constructor(private usersService: UsersService) {}

	async canActivate(context: ExecutionContext): Promise<boolean> {
		try {
			const request = context.switchToHttp().getRequest() as Request

			if (typeof request.session.userId === 'undefined') {
				throw new UnauthorizedException('Пользователь не авторизован')
			}

			const user = await this.usersService
				.findOne({
					where: {
						id: request.session.userId,
					},
					include: [
						{
							attributes: ['id', 'value', 'description'],
							model: Role,
							through: { attributes: [] },
						},
						{
							attributes: ['id'],
							model: Profile,
						},
					],
				})
				.catch((e) => {
					throw new InternalServerErrorException('Что-то пошло не так')
				})

			if (!user) {
				throw new UnauthorizedException(
					'Пользователь не найден, убедитесь в правильности учетных данных'
				)
			}

			request.user = user

			return true
		} catch (e) {
			throw new UnauthorizedException('Пользователь не авторизован')
		}
	}
}
