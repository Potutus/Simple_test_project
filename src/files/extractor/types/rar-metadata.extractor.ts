import { extract as extractRar } from 'unrar-js'

export const extractRarMetadata = {
	match: (mime: string) => mime.startsWith('application/vnd.rar'),
	handler: async (buffer: Buffer, mime: string) => {
		const archive = await extractRar({ rawData: buffer })
		return {
			type: 'rar',
			files: archive.files.map((f) => f.name),
			fileCount: archive.files.length,
		}
	},
}
