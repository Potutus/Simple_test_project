import {
	IsNotEmpty,
	IsString,
	IsUUID,
	MaxLength,
	NotContains,
} from 'class-validator'
import { SanitizeHtml } from 'src/pipes/decorators/sanitize-html.decorator'
import { MAX_TITLE_SIZE } from 'src/utils/const.config'

export class RoleDto {
	@IsNotEmpty({ message: 'Поле не должно быть пустым' })
	@IsString({ message: 'Должно быть строкой' })
	@NotContains(' ', { message: 'Не должен содержать пробелов' })
	@SanitizeHtml([], { message: 'Данные содержат недопустимые символы' })
	@MaxLength(MAX_TITLE_SIZE, {
		message: `Не должно превышать ${MAX_TITLE_SIZE} символов`,
	})
	readonly value: string

	@IsUUID(7, { message: 'Поле должно быть UUID' })
	@IsNotEmpty({ message: 'Поле не должно быть пустым' })
	@IsString({ message: 'Должно быть строкой' })
	readonly userID: string
}
