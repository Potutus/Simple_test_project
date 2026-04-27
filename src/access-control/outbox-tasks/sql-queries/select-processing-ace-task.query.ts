import { OutboxTaskStatus } from 'src/access-control/entities/acl-outbox-task.model'
import { DeletionTaskStatus } from 'src/file-system/entities/file-system-deletion-task.model'
import { minifySQL } from 'src/utils/query.service'

const selectProcessingAceTaskQuery = (): string => {
	const query = `
        WITH 

        selected AS (
            SELECT id, "updatedAt"
            FROM ace_outbox_task
            WHERE 
                status = '${OutboxTaskStatus.PROCESSING}'
                AND
                "updatedAt" < NOW() - INTERVAL '5 minutes'
            ORDER BY 
                "createdAt" ASC
            FOR UPDATE SKIP LOCKED
            LIMIT $selectTaskLimit
        )

        UPDATE ace_outbox_task task
        SET status = '${OutboxTaskStatus.PENDING}',
            "updatedAt" = NOW()
        FROM selected
        WHERE task.id = selected.id
    `

	const minifyQuery = minifySQL(query)

	return minifyQuery
}

export { selectProcessingAceTaskQuery }
