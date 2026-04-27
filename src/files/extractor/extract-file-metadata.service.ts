import { extractors } from './common-metadata.extractor'

class FileMetadataExtractorService {
	public async extractMetadata(
		buffer: Buffer,
		mime: string
	): Promise<Record<string, any>> {
		try {
			return extractors.find((el) => el.match(mime))?.handler(buffer, mime)
		} catch (err) {
			console.warn(
				`Не удалось извлечь метаданные из ${mime}:`,
				(err as any).message
			)
			return {}
		}
	}
}

const MetadataExtractor = new FileMetadataExtractorService()

export { MetadataExtractor }
