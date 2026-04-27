import { FILES_CONFIG } from 'src/utils/const.config'

type userRoles = {
	[key: string]: string
}

type filesConfig = {
	[key: string]: {
		readonly TYPE: string
		COUNT: {
			readonly FEW: number
			readonly MEDIUM: number
			readonly MANY: number
		}
		SIZE: {
			readonly SMALL: number
			readonly MEDIUM: number
			readonly LARGE: number
		}
		EXTENTION: readonly string[]
	}
}

type wikiConfig = {
	readonly NULLID: string
	CONTENT: {
		readonly MAX_DEPTH: number
	}
}

type filesConfigDir = {
	MEDIAS: string
	DOCS: string
	AVATAR: string
}

type ConfigType = typeof FILES_CONFIG

type FilesFilterType = ConfigType[keyof ConfigType]['TYPE']

export { userRoles, filesConfig, wikiConfig, filesConfigDir, FilesFilterType }
