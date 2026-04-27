type CharacteristicChild = {
	id: string
	name: string
	value: string
	position: number
}

type Characteristic = {
	id: string
	name: string
	value: string
	children: CharacteristicChild[] | null
	position: number
	updatedAt: string
	is_section: boolean
}

type Content = {
	id: string
	title: string
	content: string
	children: Content[]
	position: number
}

type GetWikiData = {
	id: string
	name: string
	path: string
	createdAt: string
	updatedAt: string
	main_image: {
		id: string
		name: string
		path: string
	} | null
	characteristics: Characteristic[]
	contents: Content[]
}

export { GetWikiData }
