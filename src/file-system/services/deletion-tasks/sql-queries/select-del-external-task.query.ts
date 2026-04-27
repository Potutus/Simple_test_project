import { DeletionTaskStatus } from 'src/file-system/entities/file-system-deletion-task.model'
import { minifySQL } from 'src/utils/query.service'

const selectDelExternalTaskQuery = (): string => {
	const query = `
        WITH 
                
        selected AS (
            SELECT id
            FROM fs_deletion_task
            WHERE status = '${DeletionTaskStatus.DELETING_EXTERNAL}'
            ORDER BY 
                "createdAt" ASC
            FOR UPDATE SKIP LOCKED
            LIMIT :selectTaskLimit
        )

        UPDATE fs_deletion_task task
        SET status = '${DeletionTaskStatus.PROCESSING}',
            "updatedAt" = NOW()
        FROM selected
        WHERE task.id = selected.id
        RETURNING task.*;
    `

	const minifyQuery = minifySQL(query)

	return minifyQuery
}

export { selectDelExternalTaskQuery }
