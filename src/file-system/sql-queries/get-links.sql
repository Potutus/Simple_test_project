
EXPLAIN ANALYZE
SELECT 
	fsn."id",
	fsn."name",
	fsn."description",
	
	(fsn."metadata"->'link'->>'id')::uuid as "targetID",
	(fsn."metadata"->'link'->>'type')::varchar as "targetType",
	
	fls."storagePath" AS "path",
	
	fsn."sortKey"
	
FROM fs_node AS fsn

INNER JOIN file_attachment AS fa
ON fa."ownerID" = (fsn."metadata"->'link'->>'id')::uuid

INNER JOIN file_storage AS fls
ON fls."id" = fa."fileID" 

WHERE 
	fsn."isLink" = true
	AND
	fsn."deletedAt" IS NULL
	
ORDER BY fsn."sortKey" ASC
;