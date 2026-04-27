import {
	IsBoolean,
	IsEmail,
	IsNotEmpty,
	IsOptional,
	IsString,
	Length,
	MaxLength,
} from 'class-validator'
import { SanitizeHtml } from 'src/pipes/decorators/sanitize-html.decorator'
import { MAX_TITLE_SIZE } from 'src/utils/const.config'

export class UpdateUserDto {
	@IsOptional()
	@IsNotEmpty({ message: 'Поле не должно быть пустым' })
	@IsString({ message: 'Должно быть строкой' })
	@Length(1, 32, { message: 'Не меньше 1 и не больше 32' })
	@SanitizeHtml([], { message: 'Данные содержат недопустимые символы' })
	readonly username: string

	@IsOptional()
	@IsBoolean({ message: 'Должно быть булевым значением.' })
	readonly isTwoFactorEnabled: boolean
}
