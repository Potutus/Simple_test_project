import {
	Table,
	Column,
	Model,
	DataType,
	ForeignKey,
	BelongsTo,
	HasMany,
} from 'sequelize-typescript'
import { uuidv7 } from 'uuidv7'

/**
 * Для вызова создания задачи использовать только:
 * @param SOFT_DELETED
 * @param PENDING
 */
export enum DeletionTaskStatus {
	SOFT_DELETED = 'soft_deleted',
	PENDING = 'pending',
	PROCESSING = 'processing',
	PROCESSING_EXTERNAL = 'processing_external',
	DELETING = 'deleting',
	DELETING_EXTERNAL = 'deleting_external',
	DONE = 'done',
	FAILED = 'failed',
}

export interface FileSystemDeletionTaskCreationAttr {
	id?: string
	nodeID: string
	ownerID: string
	parentTaskID?: string
	status: DeletionTaskStatus
	lastProcessedChildID?: string
}

@Table({
	tableName: 'fs_deletion_task',
	indexes: [
		{
			name: 'ix_deletion_task_status_updated',
			fields: ['status', 'updatedAt'],
		},
		{
			name: 'ix_deletion_task_parent_task_id',
			fields: ['parentTaskID'],
		},
		{
			name: 'ix_deletion_task_node_id',
			fields: ['nodeID'],
			unique: true,
		},
	],
})
export class FileSystemDeletionTask extends Model<
	FileSystemDeletionTask,
	FileSystemDeletionTaskCreationAttr
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
	nodeID: string

	@Column({
		type: DataType.UUID,
		allowNull: false,
	})
	ownerID: string

	@ForeignKey(() => FileSystemDeletionTask)
	@Column({
		type: DataType.UUID,
		allowNull: true,
	})
	parentTaskID: string

	@BelongsTo(() => FileSystemDeletionTask, {
		foreignKey: 'parentTaskID',
	})
	parentTask: FileSystemDeletionTask

	@HasMany(() => FileSystemDeletionTask, { foreignKey: 'parentTaskID' })
	subTasks: FileSystemDeletionTask[]

	@Column({
		type: DataType.ENUM(...Object.values(DeletionTaskStatus)),
		allowNull: false,
		defaultValue: DeletionTaskStatus.PENDING,
	})
	status: DeletionTaskStatus

	@Column({
		type: DataType.UUID,
		allowNull: true,
		comment:
			'ID последнего обработанного прямого потомка (для продолжения после сбоя)',
	})
	lastProcessedChildID: string
}
