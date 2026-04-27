import { minifySQL } from 'src/utils/query.service'

const removeTagsFromMediasQuery = (): string => {
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
        DELETE FROM media_tags AS MediaTags
        USING media, tags 
        WHERE MediaTags."mediaID" = media.mediaID 
        AND MediaTags."tagID" = tags.tagID
        RETURNING "mediaID", "tagID";

    */

	const query = `
        DELETE FROM media_tags AS MediaTags
        USING
            unnest(ARRAY[:mediaIDs]::uuid[]) AS medias(id),
            unnest(ARRAY[:tagIDs]::uuid[]) AS tags(id)
        WHERE 
            MediaTags."mediaID" = medias.id 
            AND 
            MediaTags."tagID" = tags.id
        RETURNING 
            "mediaID", 
            "tagID";
    `

	const minifyQuery = minifySQL(query)

	return minifyQuery
}

export { removeTagsFromMediasQuery }
