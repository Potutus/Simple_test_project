export interface SavedFile {
	name: string
	tmpPath: string
	finalPath: string
	size: number
	hash: string
	mimeType: string
	metadata: Record<string, any>
}
