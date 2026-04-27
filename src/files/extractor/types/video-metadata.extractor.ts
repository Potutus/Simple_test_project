const fluentFfmpeg = require('fluent-ffmpeg')
const ffprobeStatic = require('ffprobe-static')
import { writeFile } from 'fs/promises'
import { file as tmpFile } from 'tmp-promise'

fluentFfmpeg.setFfprobePath(String(ffprobeStatic.path))

export const extractVideoMetadata = {
	match: (mime: string) => mime.startsWith('video/'),
	handler: async (buffer: Buffer, mime: string) => {
		const { path, cleanup } = await tmpFile({ postfix: '.tmp' })
		// 1. Записываем буфер на временный диск для ffprobe
		await writeFile(path, buffer)

		// 2. Асинхронный вызов ffprobe, обернутый в Promise
		const metadata = await new Promise<any>((resolve, reject) => {
			// Проверка: Если ffmpeg не инициализировался корректно, ловить ошибку
			if (typeof fluentFfmpeg.ffprobe !== 'function') {
				cleanup().catch(() => null)
				return reject(
					new Error(
						'FFmpeg/ffprobe не инициализирован как функция. Проверьте импорт.'
					)
				)
			}

			fluentFfmpeg.ffprobe(String(path), (err, data) => {
				cleanup().catch(() => null) // Очищаем временный файл в любом случае

				if (err) {
					console.warn('FFProbe error:', err.message)
					return reject(new Error(`Ошибка FFProbe: ${err.message}`))
				}
				resolve(data)
			})
		})

		// 3. Возвращаем только нужные данные
		return {
			format: metadata.format,
			streams: metadata.streams.map((stream: any) => ({
				codec_type: stream.codec_type,
				codec_name: stream.codec_name,
				width: stream.width,
				height: stream.height,
				duration: parseFloat(stream.duration || metadata.format.duration),
				bit_rate: parseInt(stream.bit_rate || metadata.format.bit_rate, 10),
			})),
		}
	},
}
