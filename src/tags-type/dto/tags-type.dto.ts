import {
	IsNotEmpty,
	IsOptional,
	IsString,
	IsUUID,
	Matches,
	MaxLength,
	NotContains,
} from 'class-validator'
import { SanitizeHtml } from 'src/pipes/decorators/sanitize-html.decorator'
import { MAX_TITLE_SIZE } from 'src/utils/const.config'

export class TagTypeDto {
	@IsNotEmpty({ message: 'Поле не должно быть пустым' })
	@IsString({ message: 'Должно быть строкой' })
	@NotContains(' ', { message: 'Не должен содержать пробелов' })
	@SanitizeHtml([], { message: 'Данные содержат недопустимые символы' })
	@MaxLength(MAX_TITLE_SIZE, {
		message: `Не должно превышать ${MAX_TITLE_SIZE} символов`,
	})
	readonly name: string

	@IsNotEmpty({ message: 'Поле не должно быть пустым' })
	@IsString({ message: 'Должно быть строкой' })
	@NotContains(' ', { message: 'Не должен содержать пробелов' })
	@Matches(/^#[0-9A-Fa-f]{6}$/, { message: 'Цвет должен быть в формате HEX' })
	readonly color: string
}

export class UpdateTagTypeDto {
	@IsNotEmpty({ message: 'Поля не должны быть пустыми' })
	@IsUUID(7, { message: 'Должно быть UUID' })
	readonly tagTypeID: string

	@IsOptional()
	@IsNotEmpty({ message: 'Поле не должно быть пустым' })
	@IsString({ message: 'Должно быть строкой' })
	@NotContains(' ', { message: 'Не должен содержать пробелов' })
	@SanitizeHtml([], { message: 'Данные содержат недопустимые символы' })
	@MaxLength(MAX_TITLE_SIZE, {
		message: `Не должно превышать ${MAX_TITLE_SIZE} символов`,
	})
	readonly name: string

	@IsOptional()
	@IsNotEmpty({ message: 'Поле не должно быть пустым' })
	@IsString({ message: 'Должно быть строкой' })
	@NotContains(' ', { message: 'Не должен содержать пробелов' })
	@Matches(/^#[0-9A-Fa-f]{6}$/, { message: 'Цвет должен быть в формате HEX' })
	readonly color: string
}
