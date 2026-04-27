const FS_ACL_MASK = {
	VIEW: 1n << 0n,
	EDIT: 1n << 1n,
	SHARE: 1n << 2n,
	DELETE: 1n << 3n,
	VIEW_CHILDREN: 1n << 4n,
	EDIT_CHILDREN: 1n << 5n,
	MANAGE: 1n << 6n, //(full)
} as const

/**
 * FS_PERMISSION: строковые ключи из FS_ACL_MASK.
 */
type FS_PERMISSION = Uppercase<keyof typeof FS_ACL_MASK>

const FS_PERMISSION_KEYS = Object.keys(FS_ACL_MASK).filter((key) =>
	isNaN(Number(key))
) as FS_PERMISSION[]

const MAX_FS_ACL_MAX_VALUE = BigInt((1 << FS_PERMISSION_KEYS.length) - 1)

export { FS_ACL_MASK, MAX_FS_ACL_MAX_VALUE }
