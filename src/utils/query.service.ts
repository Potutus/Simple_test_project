export const minifySQL = (query: string): string => {
	query = query.replace(/--.*$/gm, '')
	query = query.replace(/\/\*[\s\S]*?\*\//g, '')

	query = query.replace(/\s+/g, ' ')
	query = query.trim()

	return query
}
