import { Transform } from 'class-transformer'
import {
	IsString,
	IsNotEmpty,
	IsOptional,
	IsArray,
	IsInt,
	Min,
	Max,
	IsBoolean,
	IsEnum,
	IsUUID,
	MaxLength,
} from 'class-validator'
import { SanitizeHtml } from 'src/pipes/decorators/sanitize-html.decorator'
import { MAX_TEXT_SIZE, MAX_TITLE_SIZE } from 'src/utils/const.config'

export class CreateAlbumDto {
	@IsNotEmpty({ message: 'Поле не должно быть пустым' })
	@IsString({ message: 'Должно быть строкой' })
	@SanitizeHtml([], { message: 'Данные содержат недопустимые символы' })
	@MaxLength(MAX_TITLE_SIZE, {
		message: `Не должно превышать ${MAX_TITLE_SIZE} символов`,
	})
	readonly name: string

	@IsOptional()
	@IsNotEmpty({ message: 'Поле не должно быть пустым' })
	@IsString({ message: 'Должно быть строкой' })
	@SanitizeHtml([], { message: 'Данные содержат недопустимые символы' })
	@MaxLength(MAX_TEXT_SIZE, {
		message: `Не должно превышать ${MAX_TEXT_SIZE} символов`,
	})
	readonly description?: string
}

export class UpdateAlbumDto {
	@IsUUID(7, { message: 'Должно быть UUID' })
	@IsNotEmpty({ message: 'Не должно быть пустым' })
	@IsString({ message: 'Должно быть строкой' })
	readonly albumID: string

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

export class AddMediaToAlbumDto {
	@IsUUID(7, { message: 'Должно быть UUID' })
	@IsNotEmpty({ message: 'Не должно быть пустым' })
	@IsString({ message: 'Должно быть строкой' })
	readonly albumID: string

	@IsNotEmpty({ each: true, message: 'Поля не должны быть пустыми' })
	@IsUUID(7, { each: true, message: 'Должно быть UUID' })
	@IsArray({ message: 'Должно быть массивом строк' })
	@IsString({ each: true, message: 'Каждый элемент должен быть строкой' })
	readonly mediaIDs: string[]
}

export class DeleteAlbumDto {
	@IsUUID(7, { each: true, message: 'Должно быть UUID' })
	@IsNotEmpty({ message: 'Не должно быть пустым' })
	@IsString({ message: 'Должно быть строкой' })
	readonly albumID: string
}

export class DeleteFromAlbumDto {
	@IsUUID(7, { message: 'Должно быть UUID' })
	@IsNotEmpty({ message: 'Не должно быть пустым' })
	@IsString({ message: 'Должно быть строкой' })
	readonly albumID: string

	@IsNotEmpty({ each: true, message: 'Поля не должны быть пустыми' })
	@IsUUID(7, { each: true, message: 'Должно быть UUID' })
	@IsArray({ message: 'Должно быть массивом строк' })
	@IsString({ each: true, message: 'Каждый элемент должен быть строкой' })
	readonly mediaIDs: string[]
}

export class GetAlbumsDto {
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
}

export class GetAlbumMediaDto {
	@IsUUID(7, { message: 'Должно быть UUID' })
	@IsNotEmpty({ message: 'Не должно быть пустым' })
	@IsString({ message: 'Должно быть строкой' })
	readonly albumID: string

	@IsOptional()
	@IsArray({ message: 'Должен быть массив данных' })
	@MaxLength(MAX_TITLE_SIZE, {
		each: true,
		message: `Не должно превышать ${MAX_TITLE_SIZE} символов`,
	})
	@IsString({
		each: true,
		message: 'Каждый элемент массива должен быть строкой',
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
