import {
	IsNotEmpty,
	IsOptional,
	IsString,
	MaxLength,
	IsUUID,
	IsObject,
	IsEnum,
	IsBoolean,
} from 'class-validator'
import { SanitizeHtml } from 'src/pipes/decorators/sanitize-html.decorator'
import { MAX_TEXT_SIZE, MAX_TITLE_SIZE } from 'src/utils/const.config'
import { FSLinkType } from '../entities/file-system-node.model'
import { FSGranteeType } from '../entities/file-system-acl.mode'
import { Transform } from 'class-transformer'
import { toBigIntAndValNotMaxGroupMask } from 'src/groups/utils/group-dto.utils'
import { MAX_FS_ACL_MAX_VALUE } from 'src/utils/permissions/fs-permissions.config,'

/**
 * CREATE FOLDER
 */
export class CreateFolderDto {
	@IsOptional()
	@IsUUID(null, { message: 'parentID должно быть UUID' })
	readonly parentID?: string

	@IsNotEmpty({ message: 'Название не должно быть пустым' })
	@IsString({ message: 'Название должно быть строкой' })
	@MaxLength(MAX_TITLE_SIZE, {
		message: `Название не должно превышать ${MAX_TITLE_SIZE} символов`,
	})
	@SanitizeHtml([], { message: 'Название содержит недопустимые символы' })
	readonly name: string

	@IsOptional()
	@IsString({ message: 'Описание должно быть строкой' })
	@MaxLength(MAX_TEXT_SIZE, {
		message: `Описание не должно превышать ${MAX_TEXT_SIZE} символов`,
	})
	@SanitizeHtml([], { message: 'Описание содержит недопустимые символы' })
	readonly description?: string

	@IsOptional()
	@IsObject({ message: 'metadata должно быть объектом' })
	readonly metadata?: Record<string, any>
}

/**
 * CREATE FILE
 * (физический файл приходит через Multer, но DTO валидирует метаданные)
 */
export class CreateFileDto {
	@IsOptional()
	@IsUUID(7, { message: 'parentID должно быть UUID' })
	readonly parentID?: string

	@IsNotEmpty({ message: 'Название не должно быть пустым' })
	@IsString({ message: 'Название должно быть строкой' })
	@MaxLength(MAX_TITLE_SIZE, {
		message: `Название не должно превышать ${MAX_TITLE_SIZE} символов`,
	})
	@SanitizeHtml([], { message: 'Название содержит недопустимые символы' })
	readonly name: string

	@IsOptional()
	@IsObject({ message: 'metadata должно быть объектом' })
	readonly metadata?: Record<string, any>

	@IsOptional()
	@IsUUID(7, { message: 'mediaID должно быть UUID' })
	readonly mediaID?: string

	@IsOptional()
	@IsString({ message: 'content должно быть строкой' })
	readonly content?: string
}

/**
 * CREATE LINK
 */
export class CreateLinkDto {
	@IsOptional()
	@IsNotEmpty({ message: 'parentID не должно быть пустым' })
	@IsUUID(7, { message: 'parentID должно быть UUID' })
	readonly parentID: string

	@IsOptional()
	@IsNotEmpty({ message: 'Название не должно быть пустым' })
	@IsString({ message: 'Название должно быть строкой' })
	@MaxLength(MAX_TITLE_SIZE, {
		message: `Описание не должно превышать ${MAX_TITLE_SIZE} символов`,
	})
	@SanitizeHtml([], { message: 'Название содержит недопустимые символы' })
	readonly name: string

	@IsNotEmpty({ message: 'targetType обязателен' })
	@IsEnum(FSLinkType, { message: 'Неверный тип ссылки' })
	readonly targetType: FSLinkType

	@IsNotEmpty({ message: 'targetID не должно быть пустым' })
	@IsUUID(7, { message: 'targetID должно быть UUID' })
	readonly targetID: string
}

/**
 * UPDATE NODE
 */
export class UpdateNodeDto {
	@IsNotEmpty({ message: 'nodeID не должно быть пустым' })
	@IsUUID(7, { message: 'nodeID должно быть UUID' })
	readonly nodeID: string

	@IsOptional()
	@IsNotEmpty({ message: 'Название не должно быть пустым' })
	@IsString({ message: 'Название должно быть строкой' })
	@MaxLength(MAX_TITLE_SIZE, {
		message: `Название не должно превышать ${MAX_TITLE_SIZE} символов`,
	})
	@SanitizeHtml([], { message: 'Название содержит недопустимые символы' })
	readonly name: string

	@IsOptional()
	@IsString({ message: 'Описание должно быть строкой' })
	@MaxLength(MAX_TEXT_SIZE, {
		message: `Описание не должно превышать ${MAX_TEXT_SIZE} символов`,
	})
	@SanitizeHtml([], { message: 'Описание содержит недопустимые символы' })
	readonly description?: string

	@IsOptional()
	@IsNotEmpty({ message: 'Название не должно быть пустым' })
	@IsString({ message: 'Название должно быть строкой' })
	@MaxLength(MAX_TITLE_SIZE, {
		message: `Ключ сортировки не должен превышать ${MAX_TITLE_SIZE} символов`,
	})
	@SanitizeHtml([], {
		message: 'Ключ сортировки содержит недопустимые символы',
	})
	readonly sortKey: string

	@IsOptional()
	@IsString({ message: 'Описание должно быть строкой' })
	@MaxLength(MAX_TEXT_SIZE, {
		message: `Контент не должен превышать ${MAX_TEXT_SIZE} символов`,
	})
	@SanitizeHtml([], { message: 'Контент содержит недопустимые символы' })
	readonly content?: string

	@IsOptional()
	@IsBoolean({ message: 'Значение должно быть булевым' })
	readonly isInherit?: boolean
}

/**
 * GET NODE CHILDREN
 */

export class GetNodeChildren {
	@IsNotEmpty({ message: 'Значение не должно быть пустым' })
	@IsUUID(7, { message: 'Значение должно быть UUID' })
	readonly nodeOwnerID: string
}

/**
 * FS ACL
 */

export class CreateFsACLDto {
	@IsNotEmpty({ message: 'Значение не должно быть пустым' })
	@IsUUID(7, { message: 'Значение должно быть UUID' })
	readonly nodeID: string

	@IsNotEmpty({ message: 'Значение не должно быть пустым' })
	@IsEnum(FSGranteeType, {
		message: `Тип фильтра может быть только ${Object.keys(FSGranteeType)} `,
	})
	@Transform(({ value }) =>
		Object.values(FSGranteeType).includes(value as FSGranteeType) ? value : ''
	)
	readonly granteeType: FSGranteeType

	@IsNotEmpty({ message: 'Значение не должно быть пустым' })
	@IsUUID(7, { message: 'Значение должно быть UUID' })
	readonly granteeID: string

	@IsNotEmpty({ message: 'Значение не должно быть пустым' })
	@Transform(toBigIntAndValNotMaxGroupMask(MAX_FS_ACL_MAX_VALUE, BigInt(0)))
	readonly allowMask: bigint

	@IsNotEmpty({ message: 'Значение не должно быть пустым' })
	@Transform(toBigIntAndValNotMaxGroupMask(MAX_FS_ACL_MAX_VALUE, BigInt(0)))
	readonly denyMask: bigint
}

/**
 * MOVE NODE
 */
export class MoveNodeDto {
	@IsNotEmpty({ message: 'nodeID не должно быть пустым' })
	@IsUUID(7, { message: 'Значение должно быть UUID' })
	readonly nodeID: string

	@IsOptional()
	@IsNotEmpty({ message: 'newParentID не должно быть пустым' })
	@IsUUID(7, { message: 'Значение должно быть UUID' })
	readonly newParentID: string

	@IsOptional()
	@IsBoolean({ message: 'Должно быть булевым' })
	readonly toRoot: boolean
}

/**
 * METADATA (replace)
 */
export class MetadataReplaceDto {
	@IsNotEmpty({ message: 'nodeID не должно быть пустым' })
	@IsUUID(7, { message: 'Значение должно быть UUID' })
	readonly nodeID: string

	@IsNotEmpty({ message: 'metadata обязательно' })
	@IsObject({ message: 'metadata должно быть объектом' })
	readonly metadata: Record<string, any>
}

/**
 * METADATA (merge)
 */
export class MetadataMergeDto {
	@IsNotEmpty({ message: 'nodeID не должно быть пустым' })
	@IsUUID(7)
	readonly nodeID: string

	@IsNotEmpty({ message: 'patch обязателен' })
	@IsObject({ message: 'patch должен быть объектом' })
	readonly patch: Record<string, any>
}

/**
 * TRASH DTO (optional, если хочешь формализовать)
 */
export class TrashNodeDto {
	@IsNotEmpty()
	@IsUUID(7)
	readonly nodeID: string
}
