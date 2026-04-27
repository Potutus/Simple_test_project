const GROUP_ACL_MASK = {
	VIEW: 1n << 0n, // 1
	EDIT: 1n << 1n, // 2
	DELETE: 1n << 2n, // 4
	MEMBERS_MANAGE: 1n << 3n, // 8
	ROLES_MANAGE: 1n << 4n, // 16
	SETTINGS_MANAGE: 1n << 5n, // 32
} as const

/**
 * GROUP_PERMISSION: строковые ключи из FS_ACL_MASK.
 */
type GROUP_PERMISSION = Uppercase<keyof typeof GROUP_ACL_MASK>

const GROUP_PERMISSION_KEYS = Object.keys(GROUP_ACL_MASK).filter((key) =>
	isNaN(Number(key))
) as GROUP_PERMISSION[]

const MAX_GROUP_ACL_MAX_VALUE = BigInt((1 << GROUP_PERMISSION_KEYS.length) - 1)

export { GROUP_ACL_MASK, MAX_GROUP_ACL_MAX_VALUE }
