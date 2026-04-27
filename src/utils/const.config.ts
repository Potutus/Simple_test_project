import { accessedExt } from 'src/files/types/files-filter.types'
import { wikiConfig } from './types/config/const.type'

enum TOKEN_TYPE {
	VERIFICATION = 'VERIFICATION',
	TWO_FACTOR = 'TWO_FACTOR',
	PASSWORD_RESET = 'PASSWORD_RESET',
	CHANGE_EMAIL = 'CHANGE_EMAIL',
}

const NIL_UUID = '00000000-0000-0000-0000-000000000000'

const PARALLEL_UPLOAD_LIMIT = {
	MAX: 10 as const,
}

const HMAC_TYPE = {
	EMAIL_CHANGE: {
		TYPE: `sha256`,
		CIPHER: `aes-256-gcm`,
	} as const,
}

const ROLES = {
	USER: `USER` as const,
	ADMIN: `ADMIN` as const,
	SUPERADMIN: `SUPERADMIN` as const,
} as const

const ROLES_DESCRIPTION = {
	USER: `Стандартная роль пользователя` as const,
	ADMIN: `Роль администратора` as const,
	SUPERADMIN: `Милорд` as const,
} as const

const FILES_CONFIG = {
	MEDIA: {
		TYPE: 'media',
		COUNT: {
			FEW: 5,
			MEDIUM: 10,
			MANY: 20,
		} as const,
		SIZE: {
			// 50MB
			SMALL: 1024 * 1024 * 50,
			// 1GB
			MEDIUM: 1024 * 1024 * 1024,
			// 3GB
			LARGE: 1024 * 1024 * 1024 * 3,
		} as const,
		EXTENTION: accessedExt.fsNode,
	} as const,
	FS_NODE: {
		TYPE: 'fsNode',
		COUNT: {
			FEW: 5,
			MEDIUM: 10,
			MANY: 20,
		} as const,
		SIZE: {
			// 50MB
			SMALL: 1024 * 1024 * 50,
			// 1GB
			MEDIUM: 1024 * 1024 * 1024,
			// 3GB
			LARGE: 1024 * 1024 * 1024 * 3,
		} as const,
		EXTENTION: accessedExt.fsNode,
	} as const,
	DOCS: {
		TYPE: 'docs',
		COUNT: {
			FEW: 5,
			MEDIUM: 10,
			MANY: 20,
		} as const,
		SIZE: {
			// 50MB
			SMALL: 1024 * 1024 * 50,
			// 1GB
			MEDIUM: 1024 * 1024 * 1024,
			// 3GB
			LARGE: 1024 * 1024 * 1024 * 3,
		} as const,
		EXTENTION: accessedExt.docs,
	} as const,
	AVATAR: {
		TYPE: 'avatar',
		COUNT: {
			FEW: 1,
			MEDIUM: 1,
			MANY: 1,
		} as const,
		SIZE: {
			// 10MB
			SMALL: 1024 * 1024 * 10,
			// 50MB
			MEDIUM: 1024 * 1024 * 50,
			// 1GB
			LARGE: 1024 * 1024 * 1024 * 1,
		} as const,
		EXTENTION: accessedExt.docs,
	} as const,
} as const

const WIKI_CONFIG: wikiConfig = {
	NULLID: '00000000-0000-0000-0000-000000000000',
	CONTENT: {
		MAX_DEPTH: 5,
	} as const,
} as const

const MAX_INTEGER = Number.MAX_SAFE_INTEGER
const MAX_TEXT_SIZE = 10000
const MAX_TITLE_SIZE = 255

const FILES_CONFIG_DIR = {
	MEDIAS: 'medias',
	DOCS: 'docs',
	AVATAR: 'profile_pictures',
} as const

const FS_LINK_TYPE = {
	MEDIA: '',
	FSNODE: '',
}

export {
	ROLES,
	ROLES_DESCRIPTION,
	FILES_CONFIG,
	WIKI_CONFIG,
	MAX_INTEGER,
	MAX_TEXT_SIZE,
	MAX_TITLE_SIZE,
	FILES_CONFIG_DIR,
	TOKEN_TYPE,
	HMAC_TYPE,
	PARALLEL_UPLOAD_LIMIT,
	NIL_UUID,
}
