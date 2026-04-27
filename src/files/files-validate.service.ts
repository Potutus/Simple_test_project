import { BadRequestException } from '@nestjs/common'
import { accessedExt, magicNumbers } from './types/files-filter.types'
import { AntivirusService } from './antivirus/files-antivirus.service'
import type { FileTypeResult } from 'file-type'
import { FILES_CONFIG } from 'src/utils/const.config'

const FileExtAccessed = (extention: string, filter: string): boolean => {
	const allowedExtentions = accessedExt[filter]

	if (allowedExtentions[0] === 'any') {
		return true
	}

	const result = allowedExtentions.includes(extention) ? true : false

	return result
}

const FileValidate = async (
	file: Express.Multer.File,
	filterType: string,
	fileType: FileTypeResult
): Promise<void> => {
	if (!FileExtAccessed(fileType.ext, filterType)) {
		throw new BadRequestException('Неверное расширение файла')
	}

	if (filterType !== FILES_CONFIG.FS_NODE.TYPE) {
		const validMagicNumbers = magicNumbers[fileType.mime]
		if (
			!validMagicNumbers?.some((signature) =>
				file.buffer.subarray(0, signature.length).equals(signature)
			)
		) {
			throw new BadRequestException(
				'Файл поврежден или имеет неправильный формат'
			)
		}
	}

	//const antivirus = new AntivirusService()

	//await antivirus.scanBuffer(file.buffer)
}

export { FileValidate }
