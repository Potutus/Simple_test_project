import { DeletionTaskStatus } from 'src/file-system/entities/file-system-deletion-task.model'
import { minifySQL } from 'src/utils/query.service'

const selectInsertNewTaskQuery = (): string => {
	const query = `
        WITH 
            
        parents AS (
            SELECT 
                id, 
                "nodeID", 
                "lastProcessedChildID" as "lastID",
                "ownerID"
            FROM fs_deletion_task
            WHERE status = '${DeletionTaskStatus.PENDING}'
            ORDER BY "createdAt" ASC
            FOR UPDATE SKIP LOCKED
            LIMIT :selectTaskLimit
        ),

        selected_children AS (
            SELECT 
                p.id, 
                p."nodeID" as "parentNodeID",
                n.id as "childNodeID",
                n."ownerID" as "ownerID"
            FROM parents p
            CROSS JOIN LATERAL (
                SELECT id, "ownerID"
                FROM fs_node
                WHERE "parentID" = p."nodeID"
                    AND (p."lastID" IS NULL OR id > p."lastID")
                ORDER BY id
                LIMIT :batchSizePerParentLimit
            ) n
        ),

        inserted_tasks AS (
            INSERT INTO fs_deletion_task ("id", "nodeID", "ownerID", "parentTaskID", "status", "createdAt", "updatedAt")
            SELECT gen_random_uuid(), "childNodeID", "ownerID", id, '${DeletionTaskStatus.PENDING}', NOW(), NOW() 
            FROM selected_children
            ON CONFLICT ("nodeID") DO NOTHING
        ),

        stats AS (
            SELECT
                p.id,
                COUNT(s."childNodeID") as "processedCount",
                MAX(s."childNodeID"::text)::uuid  AS "maxChildID"
            FROM parents p
            LEFT JOIN selected_children s ON p.id = s.id
            GROUP BY p.id
        )

        UPDATE fs_deletion_task t
        SET 
            "lastProcessedChildID" = COALESCE(s."maxChildID", t."lastProcessedChildID"),
            "status" = (
                CASE     
                    WHEN s."processedCount" < :batchSizePerParentLimit 
                    THEN '${DeletionTaskStatus.DELETING}'
                    ELSE '${DeletionTaskStatus.PENDING}'
                END
            )::enum_fs_deletion_task_status,
            "updatedAt" = NOW()
        FROM stats s
        WHERE t.id = s.id;
    `

	const minifyQuery = minifySQL(query)

	return minifyQuery
}

export { selectInsertNewTaskQuery }
