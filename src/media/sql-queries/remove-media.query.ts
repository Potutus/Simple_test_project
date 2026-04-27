import { minifySQL } from 'src/utils/query.service'

const removeMediaQuery = (): string => {
	const query = `
        WITH deleted AS (
            DELETE FROM media 
            WHERE id = :id::uuid
            RETURNING path
        )
        SELECT * FROM deleted;
    `

	const minifyQuery = minifySQL(query)

	return minifyQuery
}

export { removeMediaQuery }
