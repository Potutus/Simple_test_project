import { DynamicModule, Module } from '@nestjs/common'

import {
	OauthProviderOptionsSymbol,
	TypeAsyncOptions,
	TypeOptions,
} from './oauth-provider.constants'
import { OauthProviderService } from './oauth-provider.service'

@Module({})
export class OauthProviderModule {
	public static register(options: TypeOptions): DynamicModule {
		return {
			module: OauthProviderModule,
			providers: [
				{
					useValue: options.services,
					provide: OauthProviderOptionsSymbol,
				},
				OauthProviderService,
			],
			exports: [OauthProviderService],
		}
	}

	public static registerAsync(options: TypeAsyncOptions): DynamicModule {
		return {
			module: OauthProviderModule,
			imports: options.imports,
			providers: [
				{
					useFactory: options.useFactory,
					provide: OauthProviderOptionsSymbol,
					inject: options.inject,
				},
				OauthProviderService,
			],
			exports: [OauthProviderService],
		}
	}
}
