import { Table, Column, Model, DataType } from 'sequelize-typescript'
import { uuidv7 } from 'uuidv7'
import { PermissionOp } from '../auth-n/spicedb.service'

export enum OutboxTaskScope {
	RESOURCE = 'resource',
	RELATION = 'relation',
}

export enum OutboxTaskType {
	CREATE = 'create',
	UPDATE = 'update',
	DELETE = 'delete',
}

export enum OutboxTaskStatus {
	PENDING = 'pending',
	PROCESSING = 'processing',
	DELETING = 'deleting',
	COMPLETED = 'completed',
}

export interface DeleteTaskState {
	spiceResourceDone: boolean
	spiceSubjectDone: boolean
	aceDone: boolean
}

export interface ACETaskDataType {
	spiceDB?: PermissionOp
	deleteState?: DeleteTaskState
}

export interface ACEOutboxTaskCreationAttr {
	id?: string
	resourceID: string
	subjectID: string
	scope: OutboxTaskScope
	eventType: OutboxTaskType
	status: OutboxTaskStatus
	data: ACETaskDataType
	aceDeleted?: bigint
	spiceDBDeleted?: bigint
}

@Table({
	tableName: 'ace_outbox_task',
	indexes: [
		{
			name: 'ix_process_task_status_updated',
			fields: ['eventType', 'status'],
		},
		{
			name: 'ix_unique_pending_relation_task',
			fields: ['resourceID', 'subjectID'],
			unique: true,
			where: {
				scope: OutboxTaskScope.RELATION,
				status: OutboxTaskStatus.PENDING,
			},
		},
		{
			name: 'ix_unique_pending_resource_task',
			fields: ['resourceID'],
			unique: true,
			where: {
				scope: OutboxTaskScope.RESOURCE,
				status: OutboxTaskStatus.PENDING,
			},
		},
	],
})
export class ACEOutboxTask extends Model<
	ACEOutboxTask,
	ACEOutboxTaskCreationAttr
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
		type: DataType.UUID,
		allowNull: false,
	})
	resourceID: string

	@Column({
		type: DataType.UUID,
		allowNull: true,
	})
	subjectID: string

	@Column({
		type: DataType.ENUM(...Object.values(OutboxTaskScope)),
		allowNull: false,
		defaultValue: OutboxTaskScope.RELATION,
	})
	scope: OutboxTaskScope

	@Column({
		type: DataType.ENUM(...Object.values(OutboxTaskType)),
		allowNull: false,
	})
	eventType: OutboxTaskType

	@Column({
		type: DataType.ENUM(...Object.values(OutboxTaskStatus)),
		allowNull: false,
	})
	status: OutboxTaskStatus

	@Column({
		type: DataType.JSONB,
		allowNull: true,
	})
	data: ACETaskDataType

	@Column({
		type: DataType.BIGINT,
		allowNull: true,
	})
	aceDeleted: bigint

	@Column({
		type: DataType.BIGINT,
		allowNull: true,
	})
	spiceDBDeleted: bigint
}
