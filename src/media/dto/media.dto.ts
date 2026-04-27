import { Transform } from 'class-transformer'
import {
	IsOptional,
	IsArray,
	IsInt,
	Min,
	Max,
	IsString,
	IsBoolean,
	IsEnum,
	IsNotEmpty,
	IsUUID,
	MaxLength,
} from 'class-validator'
import { SanitizeHtml } from 'src/pipes/decorators/sanitize-html.decorator'
import { MAX_TEXT_SIZE, MAX_TITLE_SIZE } from 'src/utils/const.config'
import { MediaVisibility } from '../entities/media.model'
import { FilterMode } from 'src/utils/types/filter-mode.type'

export class GetMediasDto {
	@IsOptional()
	@IsArray({ message: 'Должен быть массив данных' })
	@IsNotEmpty({ each: true, message: 'Поля не должны быть пустыми' })
	@IsUUID(7, { each: true, message: 'Должно быть UUID' })
	readonly mediaIDs: string[]
}

export class UpdateMediasDto {
	@IsNotEmpty({ message: 'Поля не должны быть пустыми' })
	@IsUUID(7, { message: 'Должно быть UUID' })
	readonly mediaID: string

	@IsOptional()
	@IsNotEmpty({ message: 'Поле не должно быть пустым' })
	@IsString({ message: 'Должно быть строкой' })
	@SanitizeHtml([], { message: 'Данные содержат недопустимые символы' })
	@MaxLength(MAX_TITLE_SIZE, {
		message: `Не должно превышать ${MAX_TITLE_SIZE} символов`,
	})
	readonly name?: string

	@IsOptional()
	@IsNotEmpty({ message: 'Поле не должно быть пустым' })
	@IsString({ message: 'Должно быть строкой' })
	@SanitizeHtml([], { message: 'Данные содержат недопустимые символы' })
	@MaxLength(MAX_TEXT_SIZE, {
		message: `Не должно превышать ${MAX_TEXT_SIZE} символов`,
	})
	readonly description?: string
}

export class RemoveMediaDto {
	@IsOptional()
	@IsNotEmpty({ message: 'Поле не должно быть пустыми' })
	@IsUUID(7, { message: 'Должно быть UUID' })
	readonly mediaID: string
}

export class AddMediaRelationDto {
	@IsNotEmpty({ message: 'Поле не должно быть пустыми' })
	@IsUUID(7, { message: 'Должно быть UUID' })
	readonly mediaID: string

	@IsOptional()
	@IsArray({ message: 'Должен быть массив данных' })
	@IsNotEmpty({ each: true, message: 'Поля не должны быть пустыми' })
	@IsUUID(7, { each: true, message: 'Должно быть UUID' })
	readonly relationMediaIDs: string[]
}

export class RemoveMediaRelationDto {
	@IsNotEmpty({ message: 'Поле не должно быть пустыми' })
	@IsUUID(7, { message: 'Должно быть UUID' })
	readonly mediaID: string

	@IsOptional()
	@IsArray({ message: 'Должен быть массив данных' })
	@IsNotEmpty({ each: true, message: 'Поля не должны быть пустыми' })
	@IsUUID(7, { each: true, message: 'Должно быть UUID' })
	readonly relationMediaIDs: string[]
}

export class MediaDto {
	@IsOptional()
	@IsArray({ message: 'Должен быть массив данных' })
	@IsNotEmpty({
		each: true,
		message: 'Поля не должны быть пустыми',
	})
	@IsUUID(7, {
		each: true,
		message: 'Должно быть UUID',
	})
	readonly mediaIDs: string[]

	@IsOptional()
	@IsArray({ message: 'Должен быть массив данных' })
	@IsNotEmpty({
		each: true,
		message: 'Поля не должны быть пустыми',
	})
	@IsUUID(7, {
		each: true,
		message: 'Должно быть UUID',
	})
	readonly tagIDs: string[]

	// @IsOptional()
	// @IsArray({ message: 'Должен быть массив данных' })
	// @IsString({
	// 	each: true,
	// 	message: 'Каждый элемент массива должен быть строкой',
	// })
	// @MaxLength(MAX_TITLE_SIZE, {
	// 	each: true,
	// 	message: `Не должно превышать ${MAX_TITLE_SIZE} символов`,
	// })
	// mediaNames: string[]

	//${JSON.stringify(Object.values(MediaVisibility))}

	@IsOptional()
	@IsEnum(MediaVisibility, {
		message: `Тип фильтра может быть только 'private', 'public', 'unlisted', 'friends' `,
	})
	@Transform(({ value }) =>
		Object.values(MediaVisibility).includes(value as MediaVisibility)
			? value
			: ''
	)
	readonly visibility: MediaVisibility

	@IsOptional()
	@IsArray({ message: 'Должен быть массив данных' })
	@IsString({
		each: true,
		message: 'Каждый элемент массива должен быть строкой',
	})
	@MaxLength(MAX_TITLE_SIZE, {
		each: true,
		message: `Не должно превышать ${MAX_TITLE_SIZE} символов`,
	})
	readonly tagNames: string[]

	@IsOptional()
	@IsArray({ message: 'Должен быть массив данных' })
	@IsString({
		each: true,
		message: 'Каждый элемент массива должен быть строкой',
	})
	@MaxLength(MAX_TITLE_SIZE, {
		each: true,
		message: `Не должно превышать ${MAX_TITLE_SIZE} символов`,
	})
	readonly typeTagNames: string[]

	@IsOptional()
	@IsInt({ message: 'Должно быть числом' })
	@Min(1, { message: 'Не должно быть не меньше 1' })
	readonly page: number

	@IsOptional()
	@IsInt({ message: 'Должно быть числом' })
	@Min(1, { message: 'Не должно быть не меньше 1' })
	@Max(20, { message: 'Не должно быть больше 20' })
	readonly limit: number

	@IsOptional()
	@IsBoolean({ message: 'должно быть логическим' })
	readonly orderDirectionNew: boolean

	@IsOptional()
	@IsEnum(['strict', 'simple', ''], {
		message:
			'Тип фильтра может быть только "strict", "simple" или "" (пустая строка)',
	})
	@Transform(({ value }) => (['strict', 'simple'].includes(value) ? value : ''))
	readonly tagFilterMode: 'strict' | 'simple' | ''

	@IsOptional()
	@IsEnum(['strict', 'simple', ''], {
		message:
			'Тип фильтра может быть только "strict", "simple" или "" (пустая строка)',
	})
	@Transform(({ value }) => (['strict', 'simple'].includes(value) ? value : ''))
	readonly typeFilterMode: 'strict' | 'simple' | ''
}
