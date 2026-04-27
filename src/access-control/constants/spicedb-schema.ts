export const getSpiceDBSchema = (): string => {
	const schema = `
        definition user {}

        definition group {
            relation member: user
        }
        
        definition group_role {
            relation parent_group: group
            relation assignee: user
        }
        
        definition token {}
        
        caveat expiration_check(expiration int, now int) {
            now < expiration
        }
        
        definition node {
        
            relation parent: node
            relation block_inherit: user:*
            relation is_trashed: user:*
        
            relation reader: user | group#member | group_role#assignee | token | user with expiration_check | group#member with expiration_check | token with expiration_check
            relation editor: user | group#member | group_role#assignee | token | user with expiration_check | group#member with expiration_check | token with expiration_check
            relation manager: user | group#member | group_role#assignee | token | user with expiration_check | group#member with expiration_check | token with expiration_check
            relation owner: user    
        
            
            permission recursive_owner = owner + parent->recursive_owner
        
            permission base_view = recursive_owner + reader + manager + editor + (parent->view)
            permission base_edit = recursive_owner + editor + manager + (parent->edit) 
            permission base_manage = recursive_owner + manager + (parent->manage_access) 
            permission base_delete = owner + manager
            permission in_trash = is_trashed + (parent->is_trashed) 
        
            permission view = base_view - block_inherit
            permission edit = base_edit - block_inherit - in_trash
            permission manage_access = base_manage - block_inherit - in_trash
            permission delete = base_delete - in_trash
            permission ancestors = parent + parent->ancestors

            permission restore = (recursive_owner + manager) & in_trash
            permission hard_delete = (recursive_owner + manager) & in_trash
        
        }
    `

	return schema
}
