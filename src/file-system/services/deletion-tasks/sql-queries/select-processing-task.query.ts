import { DeletionTaskStatus } from 'src/file-system/entities/file-system-deletion-task.model'
import { minifySQL } from 'src/utils/query.service'

const selectProcessingTaskQuery = (): string => {
	const query = `
        WITH 
                
        selected AS (
            SELECT id, "updatedAt"
            FROM fs_deletion_task
            WHERE 
                status = '${DeletionTaskStatus.PROCESSING}'
                AND
                "updatedAt" < NOW() - INTERVAL '5 minutes'
            ORDER BY 
                "createdAt" ASC
            FOR UPDATE SKIP LOCKED
            LIMIT :selectTaskLimit
        )

        UPDATE fs_deletion_task task
        SET status = '${DeletionTaskStatus.PENDING}',
            "updatedAt" = NOW()
        FROM selected
        WHERE task.id = selected.id
    `

	const minifyQuery = minifySQL(query)

	return minifyQuery
}

export { selectProcessingTaskQuery }
