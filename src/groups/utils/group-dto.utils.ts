import { BadRequestException } from '@nestjs/common'
import { InternalBusinessException } from 'src/exception/internal-business.exception'

const toBigIntAndValNotMaxGroupMask = (
	maxMaskValue: bigint,
	minMaskValue: bigint
) => {
	return (params: { value: any }): bigint => {
		if (params.value === null || params.value === undefined) {
			return 0n
		}

		let bigIntVal: bigint

		try {
			bigIntVal = BigInt(params.value)

			if (bigIntVal < 0) {
				throw new BadRequestException(
					`Число ${bigIntVal} выходит за рамки минимального значения ${minMaskValue}.`
				)
			}

			if (bigIntVal > maxMaskValue) {
				throw new BadRequestException(
					`Число ${bigIntVal} выходит за рамки максимального значения ${maxMaskValue}.`
				)
			}

			return bigIntVal
		} catch (e) {
			if (e instanceof BadRequestException) {
				throw e
			}
			throw new InternalBusinessException('Значение не соответствует нужному')
		}
	}
}

export { toBigIntAndValNotMaxGroupMask }
