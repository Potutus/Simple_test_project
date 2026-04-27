import { FileTypes } from 'src/files/entities/file-storage.model'

export interface File_Data {
	fileTempPath: string
	fileDBPath: string
	fileName: string
	fileSize: bigint
	fileHash: string
	fileMimeType: string
	metadata: Record<string, any>
	fileCategory: FileTypes
}
