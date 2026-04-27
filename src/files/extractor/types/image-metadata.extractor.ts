import exifr from 'exifr'

export const extractImageMetadata = {
	match: (mime: string) => mime.startsWith('image/'),
	handler: async (buffer: Buffer, mime: string) => {
		const data = await exifr.parse(buffer, { translateValues: false })

		return data
	},
}
