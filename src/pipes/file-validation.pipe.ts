import { PipeTransform, Injectable, BadRequestException } from '@nestjs/common'
import { FILES_CONFIG } from 'src/utils/const.config'

type FileTypes = keyof typeof FILES_CONFIG

type FileConfig<T extends FileTypes> = (typeof FILES_CONFIG)[T]

type FileCountKeys<T extends FileTypes> = keyof FileConfig<T>['COUNT']
type FileSizeKeys<T extends FileTypes> = keyof FileConfig<T>['SIZE']

interface FileValidationOptions<T extends FileTypes> {
	required?: boolean
	fileType: T
	fileCount?: FileCountKeys<T>
	fileSize?: FileSizeKeys<T>
}

@Injectable()
export class FileValidationPipe<T extends FileTypes>
	implements PipeTransform<Express.Multer.File[]>
{
	constructor(private readonly options: FileValidationOptions<T>) {}

	private formatSize(bytes: number): string {
		return `${(bytes / 1024 / 1024).toFixed(2)}MB`
	}

	transform(files: Express.Multer.File[] | undefined): Express.Multer.File[] {
		if ((!files || files?.length === 0) && this.options.required) {
			throw new BadRequestException('Файлы обязательны для загрузки')
		}

		if (!this.options.required && (!files || files?.length === 0)) {
			return
		}

		const fileTypeConfig = FILES_CONFIG[this.options.fileType]
		const fileCountKey = this.options.fileCount ?? 'MEDIUM'
		const fileSizeKey = this.options.fileSize ?? 'MEDIUM'

		const maxCount = fileTypeConfig.COUNT[fileCountKey.toString()]
		const maxSize = fileTypeConfig.SIZE[fileSizeKey.toString()]

		const totalMaxSize = maxCount * maxSize

		if (files.length > maxCount) {
			throw new BadRequestException(
				`Максимально допустимое количество файлов: ${maxCount}`
			)
		}

		const totalSize = files.reduce((sum, file) => sum + file.size, 0)
		if (totalSize > totalMaxSize) {
			throw new BadRequestException(
				`Общий размер файлов слишком большой. Максимально допустимый: ${this.formatSize(totalMaxSize)}`
			)
		}

		const oversizedFiles = files.filter((file) => file.size > maxSize)
		if (oversizedFiles.length > 0) {
			const fileNames = oversizedFiles
				.map((file) => `"${file.originalname}"`)
				.join(', ')
			throw new BadRequestException(
				`Файл(ы) ${fileNames} превышают максимально допустимый размер ${this.formatSize(maxSize)}`
			)
		}

		return files
	}
}
