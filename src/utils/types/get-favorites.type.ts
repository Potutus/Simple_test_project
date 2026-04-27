type TagType = {
	id: string | null
	name: string | null
	color: string | null
}

type Tag = {
	id: string
	name: string
	type: TagType
	description: string | null
}

type GetFavoriteMediaData = {
	id: string
	name: string
	description: string
	path: string
	createdAt: string
	updatedAt: string
	tags: Tag[]
	total_count: number
}

type GetFavoriteMediaDataResponse = Omit<GetFavoriteMediaData, 'total_count'>

export { GetFavoriteMediaData, GetFavoriteMediaDataResponse }
