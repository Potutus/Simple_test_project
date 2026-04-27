import { minifySQL } from 'src/utils/query.service'

const deleteFromACEQuery = (): string => {
	const query = `
        WITH
        toDelete AS (
            SELECT id
            FROM access_control_entries
            WHERE 
                (
                    "resourceType" = $resourceType
                    AND
                    "resourceID" = $resourceID
                )
                OR
                (
                    "subjectType" = $resourceType
                    AND
                    "subjectID" = $resourceID
                )
            LIMIT $batchSize
            FOR UPDATE SKIP LOCKED
        ),

        deletedEl AS (
            DELETE FROM access_control_entries
            WHERE id
            IN (SELECT id FROM toDelete)
            RETURNING id
        )

        SELECT COUNT(*) as del_count
        FROM deletedEl;
    `

	const minifyQuery = minifySQL(query)

	return minifyQuery
}

export { deleteFromACEQuery }
