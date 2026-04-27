import * as pdfParse from 'pdf-parse'

export const extractPdfMetadata = {
	match: (mime: string) => mime.startsWith('application/pdf'),
	handler: async (buffer: Buffer, mime: string) => {
		const { info } = await pdfParse.default(buffer)
		return info
	},
}
