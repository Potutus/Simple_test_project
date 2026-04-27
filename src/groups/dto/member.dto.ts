import { IsNotEmpty, IsOptional, IsUUID } from 'class-validator'

export class GroupMemberDto {
	@IsOptional()
	@IsNotEmpty({ message: 'Поле не должно быть пустым' })
	@IsUUID(7, { message: 'Должно быть UUID' })
	readonly userID: string

	@IsOptional()
	@IsNotEmpty({ message: 'Поле не должно быть пустым' })
	@IsUUID(7, { message: 'Должно быть UUID' })
	readonly roleID: string

	@IsOptional()
	@IsNotEmpty({ message: 'Поле не должно быть пустым' })
	@IsUUID(7, { message: 'Должно быть UUID' })
	readonly groupID: string
}
