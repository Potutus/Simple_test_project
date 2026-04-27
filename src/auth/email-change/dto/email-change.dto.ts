import { IsEmail, IsNotEmpty, IsString, Matches } from 'class-validator'
import { SanitizeHtml } from 'src/pipes/decorators/sanitize-html.decorator'

export class NewEmailDto {
	@IsNotEmpty({ message: 'Поле не должно быть пустым' })
	@IsString({ message: 'Должно быть строкой' })
	@IsEmail({}, { message: 'Не корректный e-mail' })
	@SanitizeHtml([], { message: 'Данные содержат недопустимые символы' })
	readonly email: string
}

export class OldEmailConfirmationDto {
	@IsNotEmpty({ message: 'Поле не должно быть пустым' })
	@IsString({ message: 'Должно быть строкой' })
	@Matches(/^\d{6}$/, {
		message: 'Неверный формат кода',
	})
	@SanitizeHtml([], { message: 'Данные содержат недопустимые символы' })
	readonly code: string
}
