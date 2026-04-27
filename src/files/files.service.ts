import {
	BadRequestException,
	Injectable,
	InternalServerErrorException,
} from '@nestjs/common'
import * as path from 'path'
import * as mime from 'mime-types'
import * as fs from 'fs/promises'
import * as uuid from 'uuid'
import { FileValidate } from './files-validate.service'
import * as crypto from 'crypto'
import { loadEsm } from 'load-esm'
import { FILES_CONFIG_DIR } from 'src/utils/const.config'
import * as sharp from 'sharp'
import { MetadataExtractor } from 'src/files/extractor/extract-file-metadata.service'
import { StripMetadata } from 'src/files/stripper/strip-file-metadata.service'
import type { File_Data } from 'src/utils/types/file-data.type'
import { FileTypes } from './entities/file-storage.model'
import { Transaction } from 'sequelize'
import { InternalBusinessException } from 'src/exception/internal-business.exception'

@Injectable()
export class FilesService {
	private readonly BASE_PATH = path.resolve(__dirname, '..', 'static')
	private readonly TMP_PATH = path.resolve(this.BASE_PATH, 'tmp')
	private readonly PROFILE_PICTURE_PATH = path.resolve(
		this.BASE_PATH,
		FILES_CONFIG_DIR.AVATAR
	)

	constructor() {
		fs.mkdir(this.TMP_PATH, { recursive: true }).catch(console.error)
		fs.mkdir(this.PROFILE_PICTURE_PATH, { recursive: true }).catch(
			console.error
		)
	}

	private async calculateSHA256(content: Buffer): Promise<string> {
		return crypto.createHash('sha256').update(content).digest('hex')
	}

	private generateUniqueFileName(ext: string): string {
		const randomHex = crypto.randomBytes(6).toString('hex')
		const fileName = `${uuid.v4()}-${randomHex}${ext}`

		return fileName
	}

	private getFileCategoryFromMime(mime: string): File_Data['fileCategory'] {
		if (mime.startsWith('image/')) return FileTypes.IMAGE
		if (mime.startsWith('video/')) return FileTypes.VIDEO
		if (mime.startsWith('audio/')) return FileTypes.AUDIO
		if (
			mime === 'application/pdf' ||
			mime.startsWith('text/') ||
			mime.includes('word') ||
			mime.includes('excel') ||
			mime.includes('presentation')
		)
			return FileTypes.DOCUMENT

		return FileTypes.OTHERS
	}

	public tmpPathFor(fileName: string): string {
		return path.join(this.TMP_PATH, fileName)
	}

	/** Возвращает абсолютный путь к финальной локации (storagePath хранится относительным) */
	public fullPathFor(storagePath: string): string {
		return path.join(this.BASE_PATH, storagePath)
	}

	private async detectFileType(file: Express.Multer.File) {
		const { fileTypeFromBuffer } = await loadEsm('file-type')

		// 1. Пытаемся определить по сигнатуре (магическим числам)
		const detected = await fileTypeFromBuffer(file.buffer)

		if (detected) {
			return { ext: detected.ext, mime: detected.mime }
		}

		const fileExt = path
			.extname(file.originalname)
			.toLowerCase()
			.replace('.', '')

		const fileMime =
			file.mimetype ||
			mime.lookup(file.originalname) ||
			'application/octet-stream'

		return {
			ext: fileExt || 'bin',
			mime: fileMime,
		}
	}

	async createTempFile(
		file: Express.Multer.File,
		filterType: string,
		fileDirType?: string,
		transaction?: Transaction
	): Promise<File_Data> {
		try {
			const fileType = await this.detectFileType(file) // await fileTypeFromBuffer(file.buffer)

			await FileValidate(file, filterType, fileType)

			const additionalDir = fileDirType || ''

			const fileBuffer: Buffer =
				fileDirType === FILES_CONFIG_DIR.AVATAR
					? await this.optimizeAvatarFile(file.buffer)
					: file.buffer

			const fileHash = await this.calculateSHA256(fileBuffer)

			const fileName = `${fileHash}.${fileType.ext}`

			const fileTempPath = path.join(this.TMP_PATH, fileName)
			const fileDBPath = path.join(additionalDir, fileType.mime, fileName)

			const metadata = await MetadataExtractor.extractMetadata(
				fileBuffer,
				fileType.mime
			)

			const cleanedFileBuffer = await StripMetadata(fileBuffer, fileType.mime)

			const fileCategory = this.getFileCategoryFromMime(fileType.mime)

			await fs.writeFile(fileTempPath, cleanedFileBuffer)

			const fileStats = await fs.stat(fileTempPath, { bigint: true })
			const fileSize = fileStats.size

			return {
				fileTempPath: fileTempPath,
				fileDBPath: fileDBPath,
				fileName: fileName,
				fileMimeType: fileType.mime,
				fileHash: fileHash,
				fileSize: fileSize,
				fileCategory: fileCategory,
				metadata: metadata,
			}
		} catch (e) {
			if (
				e instanceof BadRequestException ||
				e instanceof InternalBusinessException
			) {
				throw e
			}

			throw new InternalBusinessException(
				'Произошла ошибка при записи файла ' + e
			)
		}
	}

	async finalizeFile(tempPath: string, finalPath: string) {
		try {
			const fullFinalPath = path.join(this.BASE_PATH, finalPath)
			const fileDir = path.dirname(fullFinalPath)

			await fs.mkdir(fileDir, { recursive: true })

			const tmpStats = await fs.stat(tempPath)
			const finalDirStats = await fs.stat(fileDir)

			if (tmpStats.dev === finalDirStats.dev) {
				await fs.rename(tempPath, fullFinalPath)
			} else {
				await fs.copyFile(tempPath, fullFinalPath)
				await fs.unlink(tempPath)
			}
		} catch (e) {
			throw new InternalBusinessException('Ошибка при перемещении файла')
		}
	}

	async createWikiPath(name: string): Promise<{ filePath: string }> {
		try {
			const filePath = `wiki/${name}_${uuid.v4()}`
			const fileDir = path.join(this.BASE_PATH, filePath)

			await fs.mkdir(fileDir, { recursive: true })

			return { filePath: filePath }
		} catch (e) {
			throw new InternalBusinessException('Произошла ошибка создании файла')
		}
	}

	async removeFile(bdName: string) {
		try {
			const filePath = bdName || ''

			const fullFilePath = path.join(this.BASE_PATH, filePath)

			await fs.unlink(fullFilePath).catch((e) => {
				if (e?.code === 'ENOENT') {
					console.warn(`Файла не существует`)
					return
				}
			})
		} catch (e) {
			throw new InternalBusinessException('Произошла ошибка при удалении файла')
		}
	}

	async removeLocalTempFile(tempPath: string) {
		try {
			const filePath = tempPath || ''

			//const fullFilePath = path.join(this.BASE_PATH, filePath)

			await fs.unlink(filePath).catch((e) => {
				if (e?.code === 'ENOENT') {
					console.warn(`Файла не существует`)
					return
				}
			})
		} catch (e) {
			throw new InternalBusinessException('Произошла ошибка при удалении файла')
		}
	}

	async removeDir(bdDirName: string) {
		try {
			const DirName = bdDirName || ''

			const fileDir = path.join(this.BASE_PATH, DirName)

			await fs.rm(fileDir, { recursive: true, force: true }).catch((e) => {
				if (e?.code === 'ENOENT') {
					console.warn(`Директории не существует`)
					return
				}
			})
		} catch (e) {
			throw new InternalBusinessException(
				'Произошла ошибка при удалении директории'
			)
		}
	}

	// НАДО ПЕРЕСМОТРЕТЬ

	async optimizeAvatarFile(fileBuffer: Buffer): Promise<Buffer> {
		try {
			const optimizedAvatarFile = await sharp(fileBuffer)
				.resize(512, 512, { fit: 'cover' })
				.jpeg({ quality: 80 })
				.toBuffer()

			return optimizedAvatarFile
		} catch (e) {
			throw new InternalBusinessException(
				'Ошибка при оптимизации избражния профиля'
			)
		}
	}

	async copyFromMediaToAvatar(
		mediaPath: string
	): Promise<{ avatarPath: string }> {
		try {
			const originalFilePath = path.resolve(this.BASE_PATH, mediaPath)

			await fs.access(originalFilePath).catch((e) => {
				throw new InternalBusinessException('Не удается найти файл')
			})

			const fileBuffer = await fs.readFile(originalFilePath).catch((e) => {
				throw new InternalBusinessException('Ошибка при чтении файла')
			})

			const optimizedAvatarFile = await this.optimizeAvatarFile(fileBuffer)

			const fileExt = path.extname(originalFilePath)

			const avatarFileName = this.generateUniqueFileName(fileExt)

			const avatarPath = path.join(FILES_CONFIG_DIR.AVATAR, avatarFileName)
			const fullAvatarPath = path.join(this.BASE_PATH, avatarPath)
			const fileDir = path.dirname(fullAvatarPath)

			await fs.mkdir(fileDir, { recursive: true })

			await fs.writeFile(fullAvatarPath, optimizedAvatarFile)

			return {
				avatarPath: avatarPath,
			}
		} catch (e) {
			if (e instanceof InternalBusinessException) {
				throw new InternalBusinessException(
					'Ошибка при копировании файла в аватары \n' + e?.message
				)
			}

			throw new InternalBusinessException(
				'Ошибка при копировании файла в аватары'
			)
		}
	}
}
