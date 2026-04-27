import {
	IsEmail,
	IsNotEmpty,
	IsOptional,
	IsString,
	Length,
	Matches,
	MaxLength,
	Validate,
} from 'class-validator'
import { IsPasswordsMatching } from 'src/libs/common/decorators/is-password-matching.decorator'
import { SanitizeHtml } from 'src/pipes/decorators/sanitize-html.decorator'
import { MAX_TITLE_SIZE } from 'src/utils/const.config'

export class LoginUserDto {
	@IsNotEmpty({ message: 'Поле не должно быть пустым' })
	@IsString({ message: 'Должно быть строкой' })
	@Length(1, 32, { message: 'Не меньше 1 и не больше 32' })
	@SanitizeHtml([], { message: 'Данные содержат недопустимые символы' })
	@MaxLength(MAX_TITLE_SIZE, {
		message: `Не должно превышать ${MAX_TITLE_SIZE} символов`,
	})
	readonly username: string

	@IsNotEmpty({ message: 'Поле не должно быть пустым' })
	@IsString({ message: 'Должно быть строкой' })
	@Length(8, 32, { message: 'Не меньше 8 и не больше 32' })
	readonly password: string

	@IsOptional()
	@IsNotEmpty({ message: 'Поле не должно быть пустым' })
	@IsString({ message: 'Должно быть строкой' })
	@MaxLength(MAX_TITLE_SIZE, {
		message: `Не должно превышать ${MAX_TITLE_SIZE} символов`,
	})
	readonly code: string
}

export class RegisterUserDto {
	@IsNotEmpty({ message: 'Поле не должно быть пустым' })
	@IsString({ message: 'Должно быть строкой' })
	@Length(1, 32, { message: 'Не меньше 1 и не больше 32' })
	@SanitizeHtml([], { message: 'Данные содержат недопустимые символы' })
	readonly username: string

	@IsNotEmpty({ message: 'Поле не должно быть пустым' })
	@IsString({ message: 'Должно быть строкой' })
	@IsEmail({}, { message: 'Не корректный e-mail' })
	@SanitizeHtml([], { message: 'Данные содержат недопустимые символы' })
	readonly email: string

	@IsNotEmpty({ message: 'Поле не должно быть пустым' })
	@IsString({ message: 'Должно быть строкой' })
	@Length(8, 32, { message: 'Не меньше 8 и не больше 32' })
	@Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*]).{8,32}$/, {
		message:
			'Пароль должен содержать хотя бы одну заглавную букву, одну строчную букву, одну цифру и один специальный символ',
	})
	readonly password: string

	@IsNotEmpty({ message: 'Поле не должно быть пустым' })
	@IsString({ message: 'Должно быть строкой' })
	@Length(8, 32, { message: 'Не меньше 8 и не больше 32' })
	@Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*]).{8,32}$/, {
		message:
			'Пароль подтверждения должен содержать хотя бы одну заглавную букву, одну строчную букву, одну цифру и один специальный символ',
	})
	@Validate(IsPasswordsMatching, {
		message: 'Пароли не совпадают',
	})
	readonly passwordRepeat: string
}
