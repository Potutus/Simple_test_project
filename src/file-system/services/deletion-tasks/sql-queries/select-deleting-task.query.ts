import { DeletionTaskStatus } from 'src/file-system/entities/file-system-deletion-task.model'
import { minifySQL } from 'src/utils/query.service'

const selectDeletingTaskQuerey = (): string => {
	const query = `
        SELECT * 
        FROM fs_deletion_task
        
        WHERE status = '${DeletionTaskStatus.DELETING}'
        ORDER BY
            "createdAt" ASC
        FOR UPDATE SKIP LOCKED
        LIMIT :selectTaskLimit
    `

	const minifyQuery = minifySQL(query)

	return minifyQuery
}

export { selectDeletingTaskQuerey }
