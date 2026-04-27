import { Transform } from 'class-transformer'
import {
	IsNotEmpty,
	IsOptional,
	IsString,
	MaxLength,
	IsUUID,
	IsInt,
	Min,
	IsArray,
} from 'class-validator'
import { SanitizeHtml } from 'src/pipes/decorators/sanitize-html.decorator'
import { MAX_TEXT_SIZE, MAX_TITLE_SIZE } from 'src/utils/const.config'
import { toBigIntAndValNotMaxGroupMask } from '../utils/group-dto.utils'
import { MAX_GROUP_ACL_MAX_VALUE } from 'src/utils/permissions/group-permissions.config'

export class GroupRoleDto {
	@IsOptional()
	@IsNotEmpty({ message: 'Поле не должно быть пустым' })
	@IsUUID(7, { message: 'Должно быть UUID' })
	readonly groupID: string

	@IsOptional()
	@IsNotEmpty({ message: 'Поле не должно быть пустым' })
	@IsUUID(7, { message: 'Должно быть UUID' })
	readonly userID: string

	@IsOptional()
	@IsNotEmpty({ message: 'Поле не должно быть пустым' })
	@IsUUID(7, { message: 'Должно быть UUID' })
	readonly roleID: string

	@IsOptional()
	@IsNotEmpty({ message: 'Название не должно быть пустым' })
	@IsString({ message: 'Должно быть строкой' })
	@MaxLength(MAX_TITLE_SIZE, {
		message: `Не должно превышать ${MAX_TITLE_SIZE} символов`,
	})
	@SanitizeHtml([], { message: 'Данные содержат недопустимые символы' })
	readonly name: string

	@IsOptional()
	@IsString({ message: 'Должно быть строкой' })
	@MaxLength(MAX_TEXT_SIZE, {
		message: `Не должно превышать ${MAX_TEXT_SIZE} символов`,
	})
	@SanitizeHtml([], { message: 'Данные содержат недопустимые символы' })
	readonly description: string

	@IsOptional()
	@Transform(toBigIntAndValNotMaxGroupMask(MAX_GROUP_ACL_MAX_VALUE, BigInt(0)))
	readonly permissions: bigint
}
