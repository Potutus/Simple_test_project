import { Body, Controller, HttpCode, Param, Post } from '@nestjs/common'
import { PasswordRecoveryService } from './password-recovery.service'
import { Recaptcha } from '@nestlab/google-recaptcha'
import { ResetPasswordDto } from './dto/reset-password.dto'
import { NewPasswordDto } from './dto/new-password.dto'
import { ApiOperation } from '@nestjs/swagger'

@Controller('auth/password-recovery')
export class PasswordRecoveryController {
	constructor(
		private readonly passwordRecoveryService: PasswordRecoveryService
	) {}

	@Recaptcha()
	@ApiOperation({ summary: 'Запрос на сброс пароля пользователя' })
	@Post('reset')
	async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
		return this.passwordRecoveryService.reset(resetPasswordDto)
	}

	@Recaptcha()
	@ApiOperation({ summary: 'Подтверждение изменения пароля пользователя' })
	@Post('new/:token')
	async newPassword(
		@Body() newPasswordDto: NewPasswordDto,
		@Param('token') token: string
	) {
		return this.passwordRecoveryService.new(newPasswordDto, token)
	}
}
