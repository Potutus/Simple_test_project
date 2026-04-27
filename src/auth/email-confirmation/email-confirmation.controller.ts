import {
	Controller,
	Get,
	Post,
	Req,
	Body,
	Patch,
	Param,
	Delete,
} from '@nestjs/common'
import { EmailConfirmationService } from './email-confirmation.service'
import { Request } from 'express'
import { ConfirmationDto } from './dto/confirmation.dto'

@Controller('auth/email-confirmation')
export class EmailConfirmationController {
	constructor(
		private readonly emailConfirmationService: EmailConfirmationService
	) {}

	@Post()
	async newVerification(
		@Req() req: Request,
		@Body() confirmationDto: ConfirmationDto
	) {
		return this.emailConfirmationService.newVerification(req, confirmationDto)
	}
}
