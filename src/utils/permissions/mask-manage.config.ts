export const maskHas = (mask: bigint, perm: bigint): boolean =>
	(BigInt(mask) & BigInt(perm)) === BigInt(perm)

export const maskAdd = (mask: bigint, perm: bigint): bigint =>
	BigInt(mask) | BigInt(perm)

export const maskRemove = (mask: bigint, perm: bigint): bigint =>
	BigInt(mask) & ~BigInt(perm)
