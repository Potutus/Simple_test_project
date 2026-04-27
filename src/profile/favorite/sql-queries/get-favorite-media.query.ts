import { minifySQL } from 'src/utils/query.service'

const getFavoriteMediaQuery = (
	sortOrder: 'DESC' | 'ASC' = 'DESC',
	tagFilterMode: 'strict' | 'simple' | '' = '',
	typeFilterMode: 'strict' | 'simple' | '' = ''
): string => {
	const tagfilterCondition =
		tagFilterMode === 'simple'
			? `COUNT(DISTINCT tags.name) > 0`
			: tagFilterMode === 'strict'
				? `COUNT(DISTINCT tags.name) = array_length(params.tag_array, 1)`
				: ''

	const typeFilterCondition =
		typeFilterMode === 'simple'
			? `COUNT(DISTINCT TagTypes.name) > 0`
			: typeFilterMode === 'strict'
				? `COUNT(DISTINCT TagTypes.name) = array_length(params.tag_type_array, 1)`
				: ''

	let filterCondition = ''

	if (tagfilterCondition || typeFilterCondition) {
		const conditions = []

		if (tagfilterCondition) {
			conditions.push(tagfilterCondition)
		}

		if (typeFilterCondition) {
			conditions.push(typeFilterCondition)
		}

		filterCondition = `HAVING ${conditions.join(' AND ')}`
	}

	const query = `
        WITH 
        
        params AS (
            SELECT 
                ARRAY[:tagArray]::text[] AS tag_array,
                ARRAY[:tagType]::text[] AS tag_type_array
        ),

        FilteredMedia AS (
            SELECT 
                Media.id, 
                MAX(ProfileFavorites."createdAt") AS added_at
            FROM media AS Media

            LEFT JOIN media_tags AS MediaTags ON Media.id = MediaTags."mediaID"
            LEFT JOIN tags AS tags ON tags.id = MediaTags."tagID"

            LEFT JOIN "tags_tagsType" AS TagsTagsType ON TagsTagsType."tagID" = Tags.id
            LEFT JOIN "tagType" AS TagTypes ON TagTypes.id = TagsTagsType."tagTypeID"

            LEFT JOIN profile_favorites AS ProfileFavorites ON ProfileFavorites."mediaID" = Media.id

            CROSS JOIN params
            WHERE ProfileFavorites."profileID" = :profileID
            AND (
                array_length(params.tag_array, 1) IS NULL
                OR tags.name = ANY(params.tag_array)
            )
            GROUP BY Media.id, params.tag_array
            ${filterCondition}
        ),

        PaginatedMedia AS (
            SELECT id, added_at
            FROM FilteredMedia
            ORDER BY added_at ${sortOrder}
            LIMIT :limit OFFSET :offset
        ),

        Count_All AS (
            SELECT COUNT(*) AS total_count
            FROM FilteredMedia
        )

        SELECT
            Media.*,

            COALESCE(
                JSONB_AGG(
                    JSONB_BUILD_OBJECT(
                        'id', tags.id, 
                        'name', tags.name, 
                        'description', tags.description,
                        'type', CASE 
                            WHEN TagTypes.id IS NOT NULL 
                            THEN 
                            JSONB_BUILD_OBJECT( 
                                'id', TagTypes.id,
                                'name', TagTypes.name,
                                'color', TagTypes.color
                            )
                            ELSE '[]'::jsonb 
                        END
                    )
                ) FILTER (WHERE tags.id IS NOT NULL),
                '[]'::jsonb
            ) AS tags,

            (
                SELECT * 
                FROM Count_All
            )

        FROM media AS Media
        JOIN PaginatedMedia ON Media.id = PaginatedMedia.id
        
        LEFT JOIN media_tags AS MediaTags ON Media.id = MediaTags."mediaID"
        LEFT JOIN tags AS tags ON tags.id = MediaTags."tagID"

        LEFT JOIN "tags_tagsType" AS TagsTagsType ON TagsTagsType."tagID" = Tags.id
        LEFT JOIN "tagType" AS TagTypes ON TagTypes.id = TagsTagsType."tagTypeID"
        
        GROUP BY Media.id, PaginatedMedia.added_at
        ORDER BY PaginatedMedia.added_at ${sortOrder};		
	`

	const minifyQuery = minifySQL(query)

	return minifyQuery
}

export { getFavoriteMediaQuery }
