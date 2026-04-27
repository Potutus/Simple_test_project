import { UseGuards, applyDecorators } from '@nestjs/common'
import { Roles } from './roles.decorator'
import { AuthenticatedGuard } from '../guard/authenticated.guard'
import { RolesGuard } from '../guard/roles.guard'

export const Authorization = (...roles: string[]) => {
	if (roles?.length > 0) {
		return applyDecorators(
			Roles(...roles),
			UseGuards(AuthenticatedGuard, RolesGuard)
		)
	}

	return applyDecorators(UseGuards(AuthenticatedGuard))
}
