import {
	IsNotEmpty,
	IsOptional,
	IsUUID,
	IsString,
	MaxLength,
} from 'class-validator'
import { SanitizeHtml } from 'src/pipes/decorators/sanitize-html.decorator'
import { MAX_TEXT_SIZE, MAX_TITLE_SIZE } from 'src/utils/const.config'

export class GroupDto {
	@IsOptional()
	@IsNotEmpty({ message: 'Поле не должно быть пустым' })
	@IsUUID(7, { message: 'Должно быть UUID v7' })
	readonly groupID: string

	@IsOptional()
	@IsString({ message: 'Должно быть строкой' })
	@MaxLength(MAX_TITLE_SIZE, {
		message: `Не должно превышать ${MAX_TITLE_SIZE} символов`,
	})
	@SanitizeHtml([], { message: 'Данные содержат недопустимые символы' })
	readonly name?: string

	@IsOptional()
	@IsString({ message: 'Должно быть строкой' })
	@MaxLength(MAX_TEXT_SIZE, {
		message: `Не должно превышать ${MAX_TEXT_SIZE} символов`,
	})
	@SanitizeHtml([], { message: 'Данные содержат недопустимые символы' })
	readonly description?: string

	@IsOptional()
	readonly metadata?: Record<string, any>
}
