export const extractTxtMetadata = {
	match: (mime: string) => mime.startsWith('text/plain'),
	handler: async (buffer: Buffer, mime: string) => {
		const text = buffer.toString('utf-8')
		const lines = text.split(/\r?\n/)
		const preview = lines.slice(0, 5).join('\n')

		return {
			lineCount: lines.length,
			characterCount: text.length,
			wordCount: text.trim().split(/\s+/).length,
			preview,
		}
	},
}
