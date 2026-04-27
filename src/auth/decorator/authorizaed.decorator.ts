import { ExecutionContext, createParamDecorator } from '@nestjs/common'
import { User } from 'src/users/entities/users.model'

export const Authorized = createParamDecorator(
	(data: keyof User, context: ExecutionContext) => {
		const request = context.switchToHttp().getRequest()
		const user = request.user

		return data ? user[data] : user
	}
)
