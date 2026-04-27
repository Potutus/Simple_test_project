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

type GetMediaData = {
	id: string
	name: string
	description: string
	path: string
	createdAt: string
	updatedAt: string
	tags: Tag[]
	total_count: number
}

type GetMediaDataResponse = Omit<GetMediaData, 'total_count'>

export { GetMediaData, GetMediaDataResponse }
