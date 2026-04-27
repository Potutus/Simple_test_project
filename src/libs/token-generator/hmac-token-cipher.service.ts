import { BadRequestException } from '@nestjs/common'
import * as crypto from 'crypto'

export type SupportedHmacTypes = 'sha256' | 'sha384' | 'sha512'
export type SupportedAEADAlgo = 'aes-256-gcm' | 'aes-192-gcm' | 'aes-128-gcm'

/**
 * Таблица соответствия алгоритмов шифрования и длины ключей.
 */
const AEAD_KEY_LENGTHS: Record<SupportedAEADAlgo, number> = {
	'aes-128-gcm': 16,
	'aes-192-gcm': 24,
	'aes-256-gcm': 32,
}

export class TokenCipher {
	private readonly encryptionKey: Buffer
	private readonly hmacKey: Buffer
	private readonly hmacType: SupportedHmacTypes
	private readonly cipherAlgo: SupportedAEADAlgo

	/**
	 * Создаёт новый экземпляр крипто-бокса для шифрования и дешифровки HMAC-защищённых токенов.
	 * @param encryptionKey - Ключ шифрования (строго определённой длины)
	 * @param hmacKey - Ключ для HMAC подписи
	 * @param hmacType - Алгоритм HMAC
	 * @param cipherAlgo - Алгоритм шифрования (AEAD)
	 */
	constructor(
		encryptionKey: Buffer,
		hmacKey: Buffer,
		hmacType: SupportedHmacTypes = 'sha256',
		cipherAlgo: SupportedAEADAlgo = 'aes-256-gcm'
	) {
		if (!TokenCipher.isSupportedHmac(hmacType)) {
			throw new BadRequestException(
				`Неподдерживаемый HMAC алгоритм: ${hmacType}`
			)
		}
		if (!TokenCipher.isSupportedAEAD(cipherAlgo)) {
			throw new BadRequestException(
				`Неподдерживаемый AEAD алгоритм: ${cipherAlgo}`
			)
		}

		const expectedLength = AEAD_KEY_LENGTHS[cipherAlgo]
		if (encryptionKey.length !== expectedLength) {
			throw new BadRequestException(
				`Неверная длина ключа: требуется ${expectedLength} байт для ${cipherAlgo}`
			)
		}

		this.encryptionKey = encryptionKey
		this.hmacKey = hmacKey
		this.hmacType = hmacType
		this.cipherAlgo = cipherAlgo
	}

	/**
	 * Шифрует и подписывает объект, возвращает безопасный токен.
	 * @param payload - Объект для шифрования
	 */
	encrypt(payload: Record<string, any>): string {
		const iv = crypto.randomBytes(12)
		const plaintext = JSON.stringify(payload)

		const cipher = crypto.createCipheriv(
			this.cipherAlgo,
			this.encryptionKey,
			iv
		)
		const encrypted = Buffer.concat([
			cipher.update(plaintext, 'utf8'),
			cipher.final(),
		])
		const authTag = cipher.getAuthTag()

		const encryptedPayload = Buffer.concat([iv, authTag, encrypted]).toString(
			'base64url'
		)

		const signature = crypto
			.createHmac(this.hmacType, this.hmacKey)
			.update(encryptedPayload)
			.digest('hex')

		return `${encryptedPayload}.${signature}`
	}

	/**
	 * Дешифрует и проверяет токен.
	 * @param token - Строка токена (шифр + подпись)
	 */
	decrypt(token: string): Record<string, any> {
		const [encryptedPayload, signature] = token.split('.')
		if (!encryptedPayload || !signature) {
			throw new BadRequestException('Невалидный формат токена')
		}

		const expectedSignature = crypto
			.createHmac(this.hmacType, this.hmacKey)
			.update(encryptedPayload)
			.digest('hex')

		if (
			!crypto.timingSafeEqual(
				Buffer.from(signature, 'hex'),
				Buffer.from(expectedSignature, 'hex')
			)
		) {
			throw new BadRequestException('Невалидная подпись HMAC')
		}

		const buffer = Buffer.from(encryptedPayload, 'base64url')
		const iv = buffer.subarray(0, 12)
		const authTag = buffer.subarray(12, 28)
		const encryptedData = buffer.subarray(28)

		const decipher = crypto.createDecipheriv(
			this.cipherAlgo,
			this.encryptionKey,
			iv
		)
		decipher.setAuthTag(authTag)

		const decrypted = Buffer.concat([
			decipher.update(encryptedData),
			decipher.final(),
		])
		return JSON.parse(decrypted.toString('utf8'))
	}

	private static isSupportedHmac(hmac: string): hmac is SupportedHmacTypes {
		return ['sha256', 'sha384', 'sha512'].includes(hmac)
	}

	private static isSupportedAEAD(algo: string): algo is SupportedAEADAlgo {
		return ['aes-256-gcm', 'aes-192-gcm', 'aes-128-gcm'].includes(algo)
	}
}
