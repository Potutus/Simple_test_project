import { loadEsm } from 'load-esm'

export const extractAudioMetadata = {
	match: (mime: string) => mime.startsWith('audio/'),
	handler: async (buffer: Buffer, mime: string) => {
		const { audioParse } = await loadEsm('music-metadata')
		const { format, common } = await audioParse.parseBuffer(buffer, mime)
		return { ...format, ...common }
	},
}
