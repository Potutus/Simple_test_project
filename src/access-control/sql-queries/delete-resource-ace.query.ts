import { minifySQL } from 'src/utils/query.service'

const deleteResourceFromACEQuery = (): string => {
	//FOR UPDATE SKIP LOCKED
	const query = `
        WITH
        toDelete AS (
            SELECT id
            FROM access_control_entries
            WHERE 
                "resourceType" = :resourceType
                AND
                "resourceID" = :resourceID
            LIMIT :batchSize
        )

        DELETE FROM access_control_entries
        WHERE id
        IN (SELECT id FROM toDelete)
    `

	const minifyQuery = minifySQL(query)

	return minifyQuery
}

export { deleteResourceFromACEQuery }
