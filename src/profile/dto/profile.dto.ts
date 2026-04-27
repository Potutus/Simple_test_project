import { IsString, IsNotEmpty, IsOptional, IsUUID } from 'class-validator'

export class UploadAvatarDto {
	@IsOptional()
	@IsNotEmpty({ message: 'Поля не должны быть пустыми' })
	@IsUUID(7, { message: 'Должно быть UUID' })
	@IsString({ message: 'Каждый элемент должен быть строкой' })
	readonly mediaID: string
}
