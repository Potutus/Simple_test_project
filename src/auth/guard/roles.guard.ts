import {
	CanActivate,
	ExecutionContext,
	ForbiddenException,
	Injectable,
} from '@nestjs/common'
import { ROLES_KEY } from '../decorator/roles.decorator'
import { Reflector } from '@nestjs/core'

@Injectable()
export class RolesGuard implements CanActivate {
	constructor(private reflector: Reflector) {}

	async canActivate(context: ExecutionContext): Promise<boolean> {
		try {
			const request = context.switchToHttp().getRequest()
			//const response = context.switchToHttp().getResponse()

			const requiredRoles = this.reflector.getAllAndOverride<string[]>(
				ROLES_KEY,
				[context.getHandler(), context.getClass()]
			)

			const rolesAccessResult = request.user.roles.some((role) =>
				requiredRoles.includes(role.value)
			)

			if (!requiredRoles) {
				return false
			}

			if (!rolesAccessResult) {
				throw new ForbiddenException('Нет доступа')
			}

			return true
		} catch (e) {
			throw new ForbiddenException('Нет доступа')
		}
	}
}
