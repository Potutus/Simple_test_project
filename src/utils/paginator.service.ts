export const getPaginationParams = (
	paginationDto: {
		page: number
		limit: number
	},
	maxCount?: number
) => {
	const page = paginationDto?.page || 1
	const limit = Math.min(paginationDto?.limit || 10, maxCount || 20)
	const offset = (page - 1) * limit
	return { limit, offset }
}
