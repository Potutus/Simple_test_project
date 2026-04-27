import { Body, Controller, Param, Post } from '@nestjs/common'
import { Recaptcha } from '@nestlab/google-recaptcha'
import { ApiOperation } from '@nestjs/swagger'
import { EmailChangeService } from './email-change.service'
import { NewEmailDto, OldEmailConfirmationDto } from './dto/email-change.dto'
import { Authorization } from '../decorator/auth.decorator'
import { Authorized } from '../decorator/authorizaed.decorator'

@Controller('auth/email-change')
export class EmailChangeController {
	constructor(private readonly emailChangeService: EmailChangeService) {}

	@Recaptcha()
	@ApiOperation({ summary: 'Запрос на сброс пароля пользователя' })
	@Authorization()
	@Post('new-email-request')
	async resetPassword(
		@Authorized('id') userID: string,
		@Body() newEmailDto: NewEmailDto
	) {
		return this.emailChangeService.sendConfirmNewEmail(userID, newEmailDto)
	}

	@Recaptcha()
	@ApiOperation({ summary: 'Подтверждение изменения пароля пользователя' })
	@Authorization()
	@Post('new-email-verify/:token')
	async newPassword(
		@Authorized('id') userID: string,
		@Param('token') token: string,
		@Body() oldEmailConfirmationDto: OldEmailConfirmationDto
	) {
		return this.emailChangeService.verifyEmailChange(
			userID,
			token,
			oldEmailConfirmationDto
		)
	}
}
