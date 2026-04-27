import * as sharp from 'sharp'
import * as ffmpeg from 'fluent-ffmpeg'
import ffmpegPath from 'ffmpeg-static'
//import ffprobePath from 'ffprobe-static'
const ffprobeStatic = require('ffprobe-static')

ffmpeg.setFfmpegPath(ffmpegPath as string)
ffmpeg.setFfprobePath(String(ffprobeStatic.path))

export async function StripMetadata(
	buffer: Buffer,
	mime: string
): Promise<Buffer> {
	try {
		if (mime.startsWith('image/')) {
			return await sharp(buffer).withMetadata({ exif: undefined }).toBuffer()
		}

		// if (mime === 'application/pdf') {
		// 	const pdf = await PDFDocument.load(buffer)
		// 	pdf.setTitle('')
		// 	pdf.setAuthor('')
		// 	pdf.setSubject('')
		// 	pdf.setKeywords([])
		// 	pdf.setProducer('')
		// 	pdf.setCreator('')

		// 	return Buffer.from(await pdf.save())
		// }

		return buffer
	} catch (err) {
		console.warn(`Не удалось очистить метаданные для ${mime}:`, err.message)
		return buffer
	}
}
