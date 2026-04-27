import {
	registerDecorator,
	ValidationOptions,
	ValidationArguments,
} from 'class-validator'
import * as sanitizeHtml from 'sanitize-html'

export function SanitizeHtml(
	allowedTags: string[] = new Array(),
	validationOptions?: ValidationOptions
) {
	return function (object: Object, propertyName: string) {
		registerDecorator({
			name: 'sanitizeHtml',
			target: object.constructor,
			propertyName: propertyName,
			options: validationOptions,
			validator: {
				validate(value: any) {
					if (typeof value !== 'string') {
						return false
					}

					const sanitizedValue = sanitizeHtml(value, {
						allowedTags: allowedTags,
					})

					return sanitizedValue === value
				},
				defaultMessage(args: ValidationArguments) {
					return `${args.property} содержит небезопасный HTML`
				},
			},
		})
	}
}
