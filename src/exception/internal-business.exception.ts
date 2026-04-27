import { HttpException, HttpStatus } from '@nestjs/common'

export class InternalBusinessException extends HttpException {
	constructor(response) {
		super(response, HttpStatus.INTERNAL_SERVER_ERROR)
		this.name = 'InternalBusinessException'
	}
}
