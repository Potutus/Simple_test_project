import { DeletionTaskStatus } from 'src/file-system/entities/file-system-deletion-task.model'
import { minifySQL } from 'src/utils/query.service'

const deleteNodesAndUpdateQuotaQuery = (): string => {
	const query = `
        WITH 

        selected_delete_tasks AS (
            SELECT * 
            FROM fs_deletion_task

            WHERE status = '${DeletionTaskStatus.DELETING}'
            ORDER BY
                "createdAt" ASC
            FOR UPDATE SKIP LOCKED
            LIMIT :selectTaskLimit
        ),

        deleted_nodes AS (
            DELETE 
            FROM fs_node 
            WHERE id = ANY(
                SELECT "nodeID"
                FROM selected_delete_tasks
            ) 
            RETURNING id, "ownerID", "sizeCache"
        ),

        quota_updates AS (
            UPDATE fs_quota_usage q
            SET "usedBytes" = GREATEST(0, q."usedBytes" - COALESCE(agg.total_size, 0))
            FROM (
                SELECT "ownerID", SUM("sizeCache") as total_size 
                FROM deleted_nodes 
                GROUP BY "ownerID"
            ) AS agg
            WHERE q."userID" = agg."ownerID"
        )
        
        UPDATE fs_deletion_task
        SET status = '${DeletionTaskStatus.DELETING_EXTERNAL}'
        WHERE id = ANY(
            SELECT id
            FROM selected_delete_tasks
        );
    `

	const minifyQuery = minifySQL(query)

	return minifyQuery
}

export { deleteNodesAndUpdateQuotaQuery }
