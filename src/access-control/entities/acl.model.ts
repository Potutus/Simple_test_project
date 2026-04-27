import { Table, Model, Column, DataType, Index } from 'sequelize-typescript'
import { uuidv7 } from 'uuidv7'

export enum AccessControlEntryStatus {
	PENDING = 'PENDING',
	SYNCED = 'SYNCED',
	FAILED = 'FAILED',
}

export enum ACESubjectRelation {
	BASE_VALUE = '.',
}

export interface AccessEntryCreateAttr {
	resourceType: string
	resourceID: string
	subjectType: string
	subjectID: string
	subjectRelation: string
	relation: string
	grantedBy?: string
	expiresAt?: Date
	caveatContext?: Record<string, any>
	syncStatus: AccessControlEntryStatus
	comment?: string
}

@Table({
	tableName: 'access_control_entries',
	timestamps: true,
	indexes: [
		// Уникальность связи: Один субъект имеет одну роль к ресурсу
		{
			name: 'ix_ace_unique_link',
			fields: [
				'resourceType',
				'resourceID',
				'subjectType',
				'subjectID',
				'subjectRelation',
				'relation',
			],
			unique: true,
		},
		// Быстрый поиск всех прав для конкретного ресурса (для UI "Кто имеет доступ к файлу?")
		{
			name: 'ix_ace_resource_lookup',
			fields: ['resourceID', 'resourceType', 'relation'],
		},
		// Быстрый поиск всех прав субъекта (для UI "Доступные мне ресурсы")
		{
			name: 'ix_ace_subject_lookup',
			fields: ['subjectID', 'subjectType', 'resourceType'],
		},
		// Кто выдал?
		{
			name: 'ix_ace_granted_by',
			fields: ['grantedBy', 'resourceType'],
		},
		// Очистка просроченных (TTL)
		{
			name: 'ix_ace_expires',
			fields: ['expiresAt'],
		},
	],
})
export class AccessControlEntry extends Model<
	AccessControlEntry,
	AccessEntryCreateAttr
> {
	@Column({
		type: DataType.UUID,
		unique: true,
		primaryKey: true,
		allowNull: false,
		defaultValue: uuidv7,
	})
	id: string

	@Column({
		type: DataType.STRING(128),
		allowNull: false,
		comment:
			'Тип ресурса: node, group, organization (совпадает с SpiceDB ObjectType)',
	})
	resourceType: string

	@Column({
		type: DataType.UUID,
		allowNull: false,
		comment: 'ID ресурса',
	})
	resourceID: string

	// --- СУБЪЕКТ (Полиморфная связь) ---
	@Column({
		type: DataType.STRING(128),
		allowNull: false,
		comment:
			'Тип субъекта: user, group, token (совпадает с SpiceDB ObjectType)',
	})
	subjectType: string

	@Column({
		type: DataType.UUID,
		allowNull: false,
	})
	subjectID: string

	@Column({
		type: DataType.STRING(64),
		allowNull: false,
		comment: 'Отношение субъекта, например "member" для group#member',
		defaultValue: ACESubjectRelation.BASE_VALUE,
	})
	subjectRelation: string

	// --- ОТНОШЕНИЕ ---
	@Column({
		type: DataType.STRING(64),
		allowNull: false,
		comment: 'Название связи: viewer, editor, member',
	})
	relation: string

	// --- МЕТАДАННЫЕ ---
	@Column({
		type: DataType.DATE,
		allowNull: true,
	})
	expiresAt: Date

	@Column({
		type: DataType.JSONB,
		allowNull: true,
		comment: 'Данные для Caveats (время, уровень риска)',
	})
	caveatContext: Record<string, any>

	@Column({
		type: DataType.UUID,
		allowNull: false,
		comment: 'Кто выдал право (User ID)',
	})
	grantedBy: string

	@Column({
		type: DataType.ENUM(...Object.values(AccessControlEntryStatus)),
		defaultValue: AccessControlEntryStatus.PENDING,
	})
	syncStatus: AccessControlEntryStatus

	@Column({
		type: DataType.STRING(512),
		allowNull: true,
	})
	comment: string
}
