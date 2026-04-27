import { WIKI_CONFIG } from 'src/utils/const.config'
import { minifySQL } from 'src/utils/query.service'

const createWikiContentQuery = (): string => {
	const query = `
        WITH 

        data AS (
            SELECT 
                UNNEST(ARRAY[:ids]::uuid[]) AS id, 
                UNNEST(ARRAY[:titles]::text[]) AS title, 
                UNNEST(ARRAY[:contents]::text[]) AS content,
                UNNEST(ARRAY[:positions]::integer[]) AS position,
                UNNEST(ARRAY[:parentIDs]::uuid[]) AS "parentID"
        ),

        filtered_data AS (
            SELECT * 
            FROM FILTER_VALID_WIKI_CONTENTS(
                ARRAY(SELECT id FROM data), 
                ARRAY(SELECT title FROM data), 
                ARRAY(SELECT content FROM data), 
                ARRAY(SELECT position FROM data), 
                ARRAY(SELECT "parentID" FROM data), 
                :maxDepth::integer
            )
        )
        
        INSERT INTO wiki_content (id, "wikiID", title, content, position, "parentID", "createdAt", "updatedAt")
        SELECT 
            filtered_data.id,
            :wikiID::uuid, 
            filtered_data.title, 
            filtered_data.content, 
            filtered_data.position, 
            filtered_data."parentID",
            CURRENT_TIMESTAMP_SHORT(),
            CURRENT_TIMESTAMP_SHORT()
        FROM filtered_data
        LEFT JOIN wiki_content AS existing_wc 
            ON filtered_data.id = existing_wc.id
        WHERE existing_wc.id IS NULL;
    `

	const minifyQuery = minifySQL(query)

	return minifyQuery
}

export { createWikiContentQuery }
