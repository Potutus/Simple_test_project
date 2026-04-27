import { Inject, Injectable, OnModuleInit } from '@nestjs/common'
import {
	OauthProviderOptionsSymbol,
	TypeOptions,
} from './oauth-provider.constants'
import { BaseOAuthService } from './services/base-oauth.service'

@Injectable()
export class OauthProviderService implements OnModuleInit {
	public constructor(
		@Inject(OauthProviderOptionsSymbol) private readonly options: TypeOptions
	) {}

	public onModuleInit() {
		for (const provider of this.options.services) {
			provider.baseUrl = this.options.baseUrl
		}
	}

	public findByService(service: string): BaseOAuthService | null {
		return this.options.services.find((s) => s.name === service) ?? null
	}
}
