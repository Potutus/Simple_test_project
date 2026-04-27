import { extractDocxMetadata } from './types/Docx-metadata.extractor'
import { extractAudioMetadata } from './types/audio-metadata.extractor'
import { extractImageMetadata } from './types/image-metadata.extractor'
import { extractPdfMetadata } from './types/pdf-metadata.extractor'
import { extractRarMetadata } from './types/rar-metadata.extractor'
import { extractTxtMetadata } from './types/txt-metadata.extractor'
import { extractVideoMetadata } from './types/video-metadata.extractor'
import { extractZipMetadata } from './types/zip-metadata.extractor'

export type NormalizedMetadata = Record<string, any>

export type Extractor = (
	buffer: Buffer,
	mime: string
) => Promise<NormalizedMetadata>

interface ExtractorRule {
	match: (mime: string) => boolean
	handler: Extractor
}

export const extractors: ExtractorRule[] = [
	extractImageMetadata,
	extractAudioMetadata,
	extractDocxMetadata,
	extractPdfMetadata,
	extractRarMetadata,
	extractTxtMetadata,
	extractVideoMetadata,
	extractZipMetadata,
]
