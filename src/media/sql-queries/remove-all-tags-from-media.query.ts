import { minifySQL } from 'src/utils/query.service'

const removeAllTagsFromMediasQuery = (): string => {
	const query = `
        DELETE FROM media_tags 
        WHERE "mediaID" = :mediaID::uuid;
    `

	const minifyQuery = minifySQL(query)

	return minifyQuery
}

export { removeAllTagsFromMediasQuery }
