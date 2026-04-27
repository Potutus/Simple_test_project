import {
	ValidationArguments,
	ValidatorConstraint,
	ValidatorConstraintInterface,
} from 'class-validator'

import { RegisterUserDto } from 'src/auth/dto/user.dto'

@ValidatorConstraint({ name: 'IsPasswordsMatching', async: false })
export class IsPasswordsMatching implements ValidatorConstraintInterface {
	public validate(passwordRepeat: string, args: ValidationArguments) {
		const obj = args?.object as RegisterUserDto
		return obj?.password === passwordRepeat
	}

	public defaultMessage(validationArguments?: ValidationArguments) {
		return 'Пароли не совпадают'
	}
}
