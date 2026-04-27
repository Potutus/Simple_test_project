import { Injectable, InternalServerErrorException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import * as argon2 from 'argon2'

@Injectable()
export class ArgonService {
	constructor(private readonly configService: ConfigService) {}

	private getSecretKey(): Buffer {
		const secretKey = Buffer.from(
			this.configService.getOrThrow<string>('PASSWORD_SECRET')
		)

		return secretKey
	}

	async hash(password: string): Promise<string> {
		const memoryCost =
			this.configService.getOrThrow<number>('ARGON_MEMORY_COST')
		const timeCost = this.configService.getOrThrow<number>('ARGON_TIME_COST')
		const parallelism =
			this.configService.getOrThrow<number>('ARGON_PARALLELISM')

		const hashedPassword = await argon2
			.hash(password, {
				type: argon2.argon2id,
				memoryCost: memoryCost,
				timeCost: timeCost,
				parallelism: parallelism,
				secret: this.getSecretKey(),
			})
			.catch((e) => {
				throw new InternalServerErrorException('Обработка пароля не прошла')
			})
		return hashedPassword
	}

	async compare(encryptedPassword, password): Promise<boolean> {
		const passwordValid = await argon2
			.verify(encryptedPassword, password, {
				secret: this.getSecretKey(),
			})
			.catch((e) => {
				throw new InternalServerErrorException('Пароль не прошел проверку')
			})
		return passwordValid
	}
}
