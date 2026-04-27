import { minifySQL } from 'src/utils/query.service'

const addTagsToMediasQuery = (): string => {
	/*
    
        WITH media AS (
            SELECT id AS mediaID 
            FROM media 
            WHERE name = ANY(ARRAY[:mediaNames]::text[])
        ),
        tags AS (
            SELECT id AS tagID 
            FROM tags 
            WHERE name = ANY(ARRAY[:tagNames]::text[])
        )
        INSERT INTO media_tags ("mediaID", "tagID")
        SELECT Media.mediaID, Tags.tagID
        FROM media AS Media
        CROSS JOIN tags AS Tags
        ON CONFLICT DO NOTHING
        RETURNING "mediaID", "tagID";



        INSERT INTO media_tags ("mediaID", "tagID")
        SELECT medias.id, tags.id
        FROM unnest(ARRAY[:mediaIDs]::uuid[]) AS medias(id)
        CROSS JOIN unnest(ARRAY[:tagIDs]::uuid[]) AS tags(id)
        ON CONFLICT DO NOTHING
        RETURNING "mediaID", "tagID";
    
    */

	const query = `
        INSERT INTO media_tags ("mediaID", "tagID")
        SELECT medias.id, tags.id
        FROM unnest(ARRAY[:mediaIDs]::uuid[]) AS medias(id)
        CROSS JOIN unnest(ARRAY[:tagIDs]::uuid[]) AS tags(id)
        ON CONFLICT DO NOTHING
        RETURNING "mediaID", "tagID";
    `

	const minifyQuery = minifySQL(query)

	return minifyQuery
}

export { addTagsToMediasQuery }
