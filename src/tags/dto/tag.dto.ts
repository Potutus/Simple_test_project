import {
	IsNotEmpty,
	IsOptional,
	IsString,
	IsUUID,
	MaxLength,
	NotContains,
} from 'class-validator'
import { SanitizeHtml } from 'src/pipes/decorators/sanitize-html.decorator'
import { MAX_TEXT_SIZE, MAX_TITLE_SIZE } from 'src/utils/const.config'

export class TagDto {
	@IsNotEmpty({ message: 'Поле не должно быть пустым' })
	@IsString({ message: 'Должно быть строкой' })
	@NotContains(' ', { message: 'Не должен содержать пробелов' })
	@SanitizeHtml([], { message: 'Данные содержат недопустимые символы' })
	@MaxLength(MAX_TITLE_SIZE, {
		message: `Не должно превышать ${MAX_TITLE_SIZE} символов`,
	})
	readonly name: string
}

export class AddTagTypeToTagDto {
	@IsNotEmpty({ message: 'Поля не должны быть пустыми' })
	@IsUUID(7, { message: 'Должно быть UUID' })
	readonly tagID: string

	@IsNotEmpty({ message: 'Поля не должны быть пустыми' })
	@IsUUID(7, { message: 'Должно быть UUID' })
	readonly tagTypeID: string
}

export class DeleteTagTypeFromTagDto {
	@IsNotEmpty({ message: 'Поля не должны быть пустыми' })
	@IsUUID(7, { message: 'Должно быть UUID' })
	readonly tagID: string

	@IsNotEmpty({ message: 'Поля не должны быть пустыми' })
	@IsUUID(7, { message: 'Должно быть UUID' })
	readonly tagTypeID: string
}

export class UpdateTagDto {
	@IsNotEmpty({ message: 'Поля не должны быть пустыми' })
	@IsUUID(7, { message: 'Должно быть UUID' })
	readonly tagID: string

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
	@SanitizeHtml([], { message: 'Данные содержат недопустимые символы' })
	@MaxLength(MAX_TEXT_SIZE, {
		message: `Не должно превышать ${MAX_TEXT_SIZE} символов`,
	})
	readonly description: string
}
