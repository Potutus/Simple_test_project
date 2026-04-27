import { Injectable, BadRequestException, Logger } from '@nestjs/common'
import { InjectModel } from '@nestjs/sequelize'
import { Transaction } from 'sequelize'
import {
	QuotaBaseLimitBytes,
	FSQuotaUsage,
} from '../../entities/fs-quota-usage.model'
import { InternalBusinessException } from 'src/exception/internal-business.exception'

enum ErrorType {
	GET = 'GET',
	SET = 'SET',
	ADJUST = 'ADJUST',
}

@Injectable()
export class FsQuotaService {
	private readonly logger = new Logger(FsQuotaService.name)

	constructor(
		@InjectModel(FSQuotaUsage)
		private readonly quotaModel: typeof FSQuotaUsage
	) {}

	/**
	 * Получить запись квот пользователя (создать если нет)
	 * @returns usedBytes, limitBytes
	 */
	async getUsage(userID: string) {
		const rec = await this.getOrCreate(userID)

		return {
			usedBytes: BigInt(rec.usedBytes || 0),
			limitBytes: rec.limitBytes == null ? null : BigInt(rec.limitBytes),
		}
	}

	/**
	 * Добавляет/убавляет байты из квота пользователя.
	 * Если число байт
	 * положительное - добавить,
	 * отрицательное - убавить
	 * @param userID - пользователь
	 * @param deltaBytes - кол-во байт для преобразования
	 * @param transaction - транзакция
	 * @returns usedBytes, limitBytes
	 */
	async checkAndAdjust(
		userID: string,
		deltaBytes: bigint,
		transaction?: Transaction
	) {
		const txProvided = !!transaction
		const tx = transaction || (await this.quotaModel.sequelize.transaction())

		try {
			const rec = await this.getOrCreate(userID, tx)

			const used = BigInt(rec.usedBytes || 0)
			const limit = rec.limitBytes == null ? null : BigInt(rec.limitBytes)

			const newUsed = used + deltaBytes

			if (newUsed < 0n) {
				rec.usedBytes = 0n
			} else {
				if (limit !== null && deltaBytes > 0n && newUsed > limit) {
					throw new BadRequestException('Превышено ограничение памяти')
				}
				rec.usedBytes = BigInt(newUsed)
			}

			await rec.save({ transaction: tx })

			if (!txProvided) await tx.commit()

			return { usedBytes: BigInt(rec.usedBytes), limitBytes: limit }
		} catch (e) {
			if (!txProvided) await tx.rollback()

			this.quotaErrorHandler(e, userID, ErrorType.ADJUST)
		}
	}

	/**
	 * Установить предел пользователю (bytes)
	 */
	async setLimit(userID: string, limitBytes: bigint, transaction: Transaction) {
		const txProvided = !!transaction
		const tx = transaction || (await this.quotaModel.sequelize.transaction())

		try {
			const rec = await this.getOrCreate(userID, tx)

			rec.limitBytes = limitBytes == null ? rec.limitBytes : BigInt(limitBytes)

			await rec.save({ transaction: tx })

			if (!txProvided) await tx.commit()

			return rec
		} catch (e) {
			if (!txProvided) await tx.rollback()

			this.quotaErrorHandler(e, userID, ErrorType.SET)
		}
	}

	/**
	 * Получить запись квот пользователя (создать если нет)
	 */
	private async getOrCreate(userID: string, transaction?: Transaction) {
		const txProvided = !!transaction
		const tx = transaction || (await this.quotaModel.sequelize.transaction())

		try {
			const [record] = await this.quotaModel.findOrCreate({
				where: { userID },
				defaults: {
					usedBytes: 0n,
					limitBytes: BigInt(QuotaBaseLimitBytes.BASE_GB5),
				},
				transaction: tx,
				lock: tx.LOCK.UPDATE,
			})

			if (!txProvided) await tx.commit()

			return record
		} catch (e) {
			if (!txProvided) await tx.rollback()

			this.quotaErrorHandler(e, userID, ErrorType.GET)
		}
	}

	/**
	 * Обработчик ошибок для квот
	 */
	private quotaErrorHandler(e: any, userID: string, type: ErrorType) {
		if (
			e instanceof BadRequestException ||
			e instanceof InternalBusinessException
		) {
			throw e
		}

		let loggerMessage: string
		let errorMessage: string

		switch (type) {
			case ErrorType.GET:
				loggerMessage = `Получение/создание квоты провалилась для пользователя ${userID}: ${e.message}`
				errorMessage = 'При получении/создании квоты, что-то пошло не так'
				break
			case ErrorType.SET:
				loggerMessage = `Выставление квоты провалилось для пользователя ${userID}: ${e.message}`
				errorMessage = 'При выставлении квоты, что-то пошло не так'
				break
			case ErrorType.ADJUST:
				loggerMessage = `Обработка квоты провалилась для пользователя ${userID}: ${e.message}`
				errorMessage = 'При обработке квоты, что-то пошло не так'
				break
			default:
				loggerMessage = `Что-то при обрабокте квот пошло не так для пользователя ${userID}: ${e.message}`
				errorMessage = 'Что-то при обработке квот пошло не так'
				break
		}

		this.logger.warn(loggerMessage)

		throw new InternalBusinessException(errorMessage)
	}
}
