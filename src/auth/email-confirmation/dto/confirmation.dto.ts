import { IsNotEmpty, IsString } from 'class-validator'

export class ConfirmationDto {
	@IsNotEmpty({ message: 'Поле не должно быть пустым' })
	@IsString({ message: 'Должно быть строкой' })
	readonly token: string
}
