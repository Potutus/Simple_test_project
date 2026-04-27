import {
	CanActivate,
	ExecutionContext,
	Injectable,
	NotFoundException,
} from '@nestjs/common'
import { Request } from 'express'
import { OauthProviderService } from '../oauth-provider/oauth-provider.service'

@Injectable()
export class OAuthProviderGuard implements CanActivate {
	public constructor(
		private readonly oauthProviderService: OauthProviderService
	) {}

	public canActivate(context: ExecutionContext) {
		const request = context.switchToHttp().getRequest() as Request

		const provider = request.params.provider

		const providerInstance = this.oauthProviderService.findByService(provider)

		if (!providerInstance) {
			throw new NotFoundException(
				`Провайдер "${provider}" не найден. Пожалуйста, проверьте правильность введенных данных.`
			)
		}

		return true
	}
}
