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
import { MAX_TITLE_SIZE } from 'src/utils/const.config'

export class AddToFavoritesDto {
	@IsNotEmpty({ each: true, message: 'Поля не должны быть пустыми' })
	@IsUUID(7, { each: true, message: 'Должно быть UUID' })
	@IsArray({ message: 'Должно быть массивом строк' })
	@IsString({ each: true, message: 'Каждый элемент должен быть строкой' })
	readonly mediaIDs: string[]
}

export class RemoveFromFavoritesDto {
	@IsNotEmpty({ each: true, message: 'Поля не должны быть пустыми' })
	@IsUUID(7, { each: true, message: 'Должно быть UUID' })
	@IsArray({ message: 'Должно быть массивом строк' })
	@IsString({ each: true, message: 'Каждый элемент должен быть строкой' })
	readonly mediaIDs: string[]
}

export class GetFavoritesDto {
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
	@IsArray({ message: 'Должен быть массив строк' })
	@IsString({
		each: true,
		message: 'Каждый элемент массива должен быть строкой',
	})
	readonly tagNames?: string[]

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
	@IsBoolean({ message: 'Должно быть логическим' })
	readonly orderDirectionNew?: boolean

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
