import {
	Body,
	Get,
	Post,
	Delete,
	Controller,
	HttpCode,
	Header,
	Req,
	HttpStatus,
	UseGuards,
	Session,
	Res,
	Param,
	Query,
	BadRequestException,
} from '@nestjs/common'

import { LoginUserDto, RegisterUserDto } from 'src/auth/dto/user.dto'
import { AuthService } from './auth.service'
import { ApiOperation } from '@nestjs/swagger'
import { Request, Response } from 'express'
import { OAuthProviderGuard } from './guard/oauth-provider.guard'
import { OauthProviderService } from './oauth-provider/oauth-provider.service'
import { ConfigService } from '@nestjs/config'
import { Recaptcha } from '@nestlab/google-recaptcha'

@Controller('auth')
export class AuthController {
	constructor(
		private readonly authService: AuthService,
		private readonly configService: ConfigService,
		private readonly oauthProviderService: OauthProviderService
	) {}

	@Recaptcha()
	@ApiOperation({ summary: 'Создать пользователя' })
	@Post('/signup')
	@HttpCode(HttpStatus.CREATED)
	async register(@Body() registerUserDto: RegisterUserDto) {
		return this.authService.register(registerUserDto)
	}

	@Recaptcha()
	@ApiOperation({ summary: 'Войти' })
	@Post('/login')
	@HttpCode(HttpStatus.OK)
	async login(@Req() req: Request, @Body() loginUserDto: LoginUserDto) {
		return this.authService.login(req, loginUserDto)
	}

	@ApiOperation({ summary: 'Получение ссылки для авторизации oauth' })
	@UseGuards(OAuthProviderGuard)
	@Get('/oauth/callback/:provider')
	async callback(
		@Req() req: Request,
		@Res({ passthrough: true }) res: Response,
		@Query('code') code: string,
		@Param('provider') provider: string
	) {
		if (!code) {
			throw new BadRequestException('Не был предоставлен код авторизации')
		}

		await this.authService.extractProfileFromCode(req, provider, code)

		return res.redirect(
			`${this.configService.getOrThrow<string>('CLIENT_URL')}/profile`
		)
	}

	@ApiOperation({ summary: 'Получение ссылки для авторизации oauth' })
	@UseGuards(OAuthProviderGuard)
	@Get('/oauth/connect/:provider')
	async connect(@Param('provider') provider: string) {
		const providerInstance = this.oauthProviderService.findByService(provider)

		return {
			url: providerInstance.getAuthUrl(),
		}
	}

	@ApiOperation({ summary: 'Выйти' })
	@Post('/logout')
	@HttpCode(HttpStatus.OK)
	async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
		return this.authService.logout(req, res)
	}
}
