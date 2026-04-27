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

type GetAlbumMediaData = {
	id: string
	name: string
	description: string
	path: string
	createdAt: string
	updatedAt: string
	tags: Tag[]
	total_count: number
}

type GetAlbumMediaDataResponse = Omit<GetAlbumMediaData, 'total_count'>

export { GetAlbumMediaData, GetAlbumMediaDataResponse }
