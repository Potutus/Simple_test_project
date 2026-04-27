import { parseStringPromise } from 'xml2js'
import yauzl from 'yauzl'

export const extractDocxMetadata = {
	match: (mime: string) =>
		mime.startsWith(
			'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
		),
	handler: async (buffer: Buffer, mime: string) => {
		return new Promise((resolve, reject) => {
			yauzl.fromBuffer(buffer, { lazyEntries: true }, (err, zipfile) => {
				if (err || !zipfile) return reject(err)

				let found = false
				zipfile.readEntry()

				zipfile.on('entry', (entry) => {
					if (entry.fileName === 'docProps/core.xml') {
						found = true
						zipfile.openReadStream(entry, (err, stream) => {
							if (err || !stream) return reject(err)

							let data = ''
							stream.on('data', (chunk) => (data += chunk.toString()))
							stream.on('end', async () => {
								try {
									const parsed = await parseStringPromise(data)
									resolve(parsed)
								} catch (e) {
									reject(e)
								}
							})
						})
					} else {
						zipfile.readEntry()
					}
				})

				zipfile.on('end', () => {
					if (!found) resolve({})
				})
			})
		})
	},
}
