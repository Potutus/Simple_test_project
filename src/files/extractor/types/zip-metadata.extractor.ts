import { writeFile } from 'fs/promises'
import { file as tmpFile } from 'tmp-promise'
import StreamZip from 'node-stream-zip'

export const extractZipMetadata = {
	match: (mime: string) => mime.startsWith('application/zip'),
	handler: async (buffer: Buffer, mime: string) => {
		const { path, cleanup } = await tmpFile({ postfix: '.zip' })
		await writeFile(path, buffer)

		const zip = new StreamZip.async({ file: path })
		const entries = await zip.entries()
		await zip.close()
		await cleanup().catch(() => null)

		return {
			type: 'zip',
			files: Object.keys(entries),
			fileCount: Object.keys(entries).length,
		}
	},
}
