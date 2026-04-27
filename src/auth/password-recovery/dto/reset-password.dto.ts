import { IsEmail, IsNotEmpty, IsString } from 'class-validator'
import { SanitizeHtml } from 'src/pipes/decorators/sanitize-html.decorator'

export class ResetPasswordDto {
	@IsNotEmpty({ message: 'Поле не должно быть пустым' })
	@IsString({ message: 'Должно быть строкой' })
	@IsEmail({}, { message: 'Не корректный e-mail' })
	@SanitizeHtml([], { message: 'Данные содержат недопустимые символы' })
	readonly email: string
}
