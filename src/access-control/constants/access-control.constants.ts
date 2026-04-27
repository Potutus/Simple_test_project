// access-control.constants.ts

const createEnum = <T extends string>(values: T[]) => {
	const obj = {} as Record<string, string>
	values.forEach((key) => {
		obj[key] = key.toLowerCase()
	})
	return obj as { readonly [K in T]: Lowercase<K> }
}
/**
 * Типы ресурсов (Objects in SpiceDB schema)
 */
export const AclResource = createEnum([
	'NODE',
	'USER',
	'GROUP',
	'GROUP_ROLE',
	'TOKEN',
])
/**
 * Типы субъектов (Subjects in SpiceDB schema)
 */
export const AclSubject = { ...AclResource }

export type AclResource = (typeof AclResource)[keyof typeof AclResource]
export type AclSubject = (typeof AclSubject)[keyof typeof AclSubject]

/**
 * Все возможные отношения (Relations in SpiceDB schema)
 */
export enum AclRelation {
	// Для файлов/папок
	READER = 'reader',
	EDITOR = 'editor',
	MANAGER = 'manager',
	OWNER = 'owner',

	// Для групп
	MEMBER = 'member',

	//Для ролей групп
	PARENT_GROUP = 'parent_group',
	ASIGNEE = 'assignee',

	// Для папок (наследование)
	PARENT = 'parent',
	BLOCK_INHERIT = 'block_inherit',

	// Для мусорки
	IS_TRASHED = 'is_trashed',

	// Для отбраковки subjectRelation
	EMPTY = '',
}

/**
 * Проверка доступа
 */
export enum AclPermission {
	VIEW = 'view',
	EDIT = 'edit',
	MANAGE_ACCESS = 'manage_access',
	DELETE = 'delete',
	HARD_DELETE = 'hard_delete',
	RESTORE = 'restore',
	ANCESTORS = 'ancestors',
}

/**
 * Проверка доступа
 */
export enum CaveatNames {
	EXPIRATION = 'expiration_check',
}

/**
 * ВАЛИДАЦИЯ СХЕМЫ:
 * Маппинг, определяющий, какие отношения допустимы для конкретного типа ресурса.
 * Это предотвращает создание бессмысленных связей (например, 'member' для файла).
 */
export const ValidResourceRelations: Record<AclResource, AclRelation[]> = {
	[AclResource.NODE]: [
		AclRelation.READER,
		AclRelation.EDITOR,
		AclRelation.MANAGER,
		AclRelation.OWNER,
		AclRelation.PARENT,
		AclRelation.BLOCK_INHERIT,
		AclRelation.IS_TRASHED,
	],
	[AclResource.GROUP]: [AclRelation.MEMBER],
	[AclResource.GROUP_ROLE]: [AclRelation.ASIGNEE, AclRelation.PARENT_GROUP],
	[AclResource.TOKEN]: [],
	[AclResource.USER]: [],
}

/**
 * ВАЛИДАЦИЯ СХЕМЫ для Subject:
 */
export const ValidSubjectRelations: Record<AclResource, AclRelation[]> = {
	[AclResource.NODE]: [AclRelation.EMPTY],
	[AclResource.GROUP]: [AclRelation.MEMBER],
	[AclResource.GROUP_ROLE]: [AclRelation.ASIGNEE],
	[AclResource.TOKEN]: [AclRelation.EMPTY],
	[AclResource.USER]: [AclRelation.EMPTY],
}
