import {
	IsEnum,
	IsOptional,
	IsString,
	IsNotEmpty,
	IsUUID,
	IsObject,
	IsDate,
	MaxLength,
} from 'class-validator'
import { Type } from 'class-transformer'
import {
	AclPermission,
	AclRelation,
	AclResource,
	AclSubject,
} from '../constants/access-control.constants'
import { SanitizeHtml } from 'src/pipes/decorators/sanitize-html.decorator'
import { MAX_TEXT_SIZE } from 'src/utils/const.config'

/**
 * GRANT PERMISSION
 * Выдача прав доступа (создание связи)
 */
export class GrantPermissionDto {
	@IsNotEmpty({ message: 'Тип ресурса обязателен' })
	@IsEnum(AclResource, { message: 'Недопустимый тип ресурса' })
	readonly resourceType: AclResource

	@IsNotEmpty({ message: 'ID ресурса обязателен' })
	@IsUUID(7, { message: 'ID ресурса должен быть валидным UUID v7' })
	readonly resourceID: string

	@IsNotEmpty({ message: 'Тип субъекта обязателен' })
	@IsEnum(AclSubject, { message: 'Недопустимый тип субъекта' })
	readonly subjectType: AclSubject

	@IsNotEmpty({ message: 'ID субъекта обязателен' })
	@IsUUID(7, { message: 'ID субъекта должен быть валидным UUID v7' })
	readonly subjectID: string

	@IsOptional()
	@IsNotEmpty({ message: 'Отношение (роль) обязательно' })
	@IsEnum(AclRelation, { message: 'Недопустимый тип отношения' })
	readonly subjectRelation?: AclRelation

	@IsNotEmpty({ message: 'Отношение (роль) обязательно' })
	@IsEnum(AclRelation, { message: 'Недопустимый тип отношения' })
	readonly relation: AclRelation

	@IsOptional()
	@IsObject({ message: 'Контекст условий (Caveats) должен быть объектом' })
	readonly caveatContext?: Record<string, any>

	@IsOptional()
	@Type(() => Date)
	@IsDate({ message: 'Некорректный формат даты истечения' })
	readonly expiresAt?: Date

	@IsOptional()
	@IsString({ message: 'Комментарий должен быть строкой' })
	@MaxLength(MAX_TEXT_SIZE, {
		message: `Комментарий не должен превышать ${MAX_TEXT_SIZE} символов`,
	})
	@SanitizeHtml([], { message: 'Комментарий содержит недопустимые символы' })
	readonly comment?: string
}

/**
 * REVOKE PERMISSION
 * Отзыв прав доступа (удаление связи)
 */
export class RevokePermissionDto {
	@IsNotEmpty({ message: 'Тип ресурса обязателен' })
	@IsEnum(AclResource, { message: 'Недопустимый тип ресурса' })
	readonly resourceType: AclResource

	@IsNotEmpty({ message: 'ID ресурса обязателен' })
	@IsUUID(7, { message: 'ID ресурса должен быть валидным UUID v7' })
	readonly resourceID: string

	@IsNotEmpty({ message: 'Тип субъекта обязателен' })
	@IsEnum(AclSubject, { message: 'Недопустимый тип субъекта' })
	readonly subjectType: AclSubject

	@IsNotEmpty({ message: 'ID субъекта обязателен' })
	@IsUUID(7, { message: 'ID субъекта должен быть валидным UUID v7' })
	readonly subjectID: string

	@IsOptional()
	@IsNotEmpty({ message: 'Отношение (роль) обязательно' })
	@IsEnum(AclRelation, { message: 'Недопустимый тип отношения' })
	readonly subjectRelation?: AclRelation

	@IsNotEmpty({ message: 'Отношение (роль) обязательно' })
	@IsEnum(AclRelation, { message: 'Недопустимый тип отношения' })
	readonly relation: AclRelation
}

/**
 * CHECK PERMISSION
 * Проверка доступа
 */
export class CheckPermissionDto {
	@IsNotEmpty({ message: 'Тип ресурса обязателен' })
	@IsEnum(AclResource, { message: 'Недопустимый тип ресурса' })
	readonly resourceType: AclResource

	@IsNotEmpty({ message: 'ID ресурса обязателен' })
	@IsUUID(7, { message: 'ID ресурса должен быть валидным UUID v7' })
	readonly resourceID: string

	@IsNotEmpty({ message: 'Тип субъекта обязателен' })
	@IsEnum(AclSubject, { message: 'Недопустимый тип субъекта' })
	readonly subjectType: AclSubject

	@IsNotEmpty({ message: 'ID субъекта обязателен' })
	@IsUUID(7, { message: 'ID субъекта должен быть валидным UUID v7' })
	readonly subjectID: string

	@IsNotEmpty({ message: 'Отношение (роль) обязательно' })
	@IsEnum(AclPermission, { message: 'Недопустимый тип отношения' })
	readonly action: AclPermission

	@IsOptional()
	@IsObject({ message: 'Контекст условий (Caveats) должен быть объектом' })
	readonly contextData?: Record<string, any>
}
