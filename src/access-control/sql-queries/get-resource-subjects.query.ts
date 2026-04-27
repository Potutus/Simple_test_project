import { minifySQL } from 'src/utils/query.service'

const getResourceSubjectsQuery = (
	sortOrder: 'DESC' | 'ASC' = 'DESC'
): string => {
	const query = `
        SELECT ace_nodes.* 
        FROM access_control_entries ace_nodes 
        
        WHERE ace_nodes."resourceType" = :resourceType 
            AND ace_nodes."resourceID" = :resourceID
            AND ace_nodes."grantedBy" = :userID
        
        ORDER BY ace_nodes."id" ${sortOrder} 
        LIMIT :limit;
    `

	const minifyQuery = minifySQL(query)

	return minifyQuery
}

export { getResourceSubjectsQuery }
