import { IsNotEmpty, IsString, MaxLength } from 'class-validator'
import { SanitizeHtml } from 'src/pipes/decorators/sanitize-html.decorator'
import { MAX_TEXT_SIZE, MAX_TITLE_SIZE } from 'src/utils/const.config'

export class CreateRoleDto {
	@IsNotEmpty({ message: 'Поле не должно быть пустым' })
	@IsString({ message: 'Должно быть строкой' })
	@SanitizeHtml([], { message: 'Данные содержат недопустимые символы' })
	@MaxLength(MAX_TITLE_SIZE, {
		message: `Не должно превышать ${MAX_TITLE_SIZE} символов`,
	})
	readonly value: string

	@IsNotEmpty({ message: 'Поле не должно быть пустым' })
	@IsString({ message: 'Должно быть строкой' })
	@SanitizeHtml([], { message: 'Данные содержат недопустимые символы' })
	@MaxLength(MAX_TEXT_SIZE, {
		message: `Не должно превышать ${MAX_TEXT_SIZE} символов`,
	})
	readonly description: string
}
