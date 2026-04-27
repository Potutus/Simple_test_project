import { minifySQL } from 'src/utils/query.service'

const getSharedAccessQuery = (sortOrder: 'DESC' | 'ASC' = 'DESC'): string => {
	const query = `
        SELECT ace_nodes.*
        FROM access_control_entries ace_nodes

        JOIN access_control_entries ace_members 
            ON ace_nodes."subjectID" = ace_members."resourceID"
            AND ace_nodes."subjectType" = ace_members."resourceType"
            
        WHERE ace_members."subjectType" = :subjectType
            AND ace_members."subjectID" = :subjectID
            AND ace_nodes."resourceType" = :resourceType

        ORDER BY ace_nodes."id" ${sortOrder}
        LIMIT :limit;
    `

	const minifyQuery = minifySQL(query)

	return minifyQuery
}

export { getSharedAccessQuery }
