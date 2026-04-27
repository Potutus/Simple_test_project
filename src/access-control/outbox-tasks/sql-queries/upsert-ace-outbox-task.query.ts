import { OutboxTaskScope } from 'src/access-control/entities/acl-outbox-task.model'
import { minifySQL } from 'src/utils/query.service'

/**
 * Запрос для Upsert (создание или обновление) задач в Outbox.
 */
const upsertACEOutboxTaskQuery = (scope: OutboxTaskScope): string => {
	const conflictTarget =
		scope === OutboxTaskScope.RELATION
			? `("resourceID", "subjectID") WHERE (scope = 'relation' AND status = 'pending')`
			: `("resourceID") WHERE (scope = 'resource' AND status = 'pending')`

	const query = `
        INSERT INTO ace_outbox_task (
            id, 
            "resourceID", 
            "subjectID", 
            scope, 
            "eventType", 
            status, 
            data, 
            "createdAt", 
            "updatedAt"
        )

        SELECT 
            u.id, 
            u.r_id, 
            u.s_id, 
            u.sc, 
            u.e_t, 
            u.st, 
            u.d, 
            NOW(),
            NOW()  
        FROM UNNEST(
            $ids::uuid[], 
            $resourceIDs::uuid[], 
            $subjectIDs::uuid[], 
            $scopes::"enum_ace_outbox_task_scope"[], 
            $eventTypes::"enum_ace_outbox_task_eventType"[], 
            $statuses::"enum_ace_outbox_task_status"[], 
            $datas::jsonb[]
        ) AS u(id, r_id, s_id, sc, e_t, st, d)
        
        ON CONFLICT ${conflictTarget}
        DO UPDATE SET 
            "eventType" = EXCLUDED."eventType",
            "data" = EXCLUDED."data",
            "updatedAt" = NOW()
    `

	return minifySQL(query)
}

export { upsertACEOutboxTaskQuery }
