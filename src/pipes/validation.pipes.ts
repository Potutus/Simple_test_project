import {
	ArgumentMetadata,
	BadRequestException,
	Injectable,
	PipeTransform,
} from '@nestjs/common'
import { plainToClass } from 'class-transformer'
import { validate } from 'class-validator'
//import { ValidationException } from 'src/exception/validations.exception' //просто как пример своих исключений

@Injectable()
export class ValidationPipe implements PipeTransform<any> {
	private toValidate(metatype: any): boolean {
		const types: any[] = [String, Boolean, Number, Array, Object]
		return !types.includes(metatype)
	}

	private getErrorMessages(errors: any[], parentProperty = ''): string[] {
		let messages: string[] = new Array<string>()

		errors.forEach((err) => {
			const property = parentProperty
				? `${parentProperty}.${err.property}`
				: err.property

			if (err.constraints) {
				messages.push(
					...Object.values(err.constraints).map(
						(message) => `${property} - ${message}`
					)
				)
			}

			if (err.children && err.children.length > 0) {
				messages.push(...this.getErrorMessages(err.children, property))
			}
		})

		return messages
	}

	async transform(value: any, metadata: ArgumentMetadata): Promise<any> {
		if (!value || !metadata.metatype || !this.toValidate(metadata.metatype)) {
			return value
		}

		const obj = plainToClass(metadata.metatype, value)
		const errors = await validate(obj)

		if (errors?.length) {
			const messages = this.getErrorMessages(errors)

			throw new BadRequestException(messages)
		}

		return obj
	}
}
