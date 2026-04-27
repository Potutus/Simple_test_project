import { IsNotEmpty, IsString, Length, Matches } from 'class-validator'

export class NewPasswordDto {
	@IsNotEmpty({ message: 'Поле не должно быть пустым' })
	@IsString({ message: 'Должно быть строкой' })
	@Length(8, 32, { message: 'Не меньше 8 и не больше 32' })
	@Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*]).{8,32}$/, {
		message:
			'Пароль должен содержать хотя бы одну заглавную букву, одну строчную букву, одну цифру и один специальный символ',
	})
	readonly password: string
}
