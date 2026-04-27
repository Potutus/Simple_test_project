import { IsOptional, IsNotEmpty, IsUUID } from 'class-validator'

import { ACETaskDataType } from '../entities/acl-outbox-task.model'

/**
 * Данные для создание задачи
 */
export class AceOutboxTaskDto {
	@IsNotEmpty({ message: 'ID ресурса обязателен' })
	@IsUUID(7, { message: 'ID ресурса должен быть валидным UUID v7' })
	readonly resourceID: string

	@IsNotEmpty({ message: 'ID ресурса обязателен' })
	@IsUUID(7, { message: 'ID ресурса должен быть валидным UUID v7' })
	readonly subjectID: string

	@IsNotEmpty({ message: 'Тип ресурса обязателен' })
	//@IsEnum(ACETaskDataType, { message: 'Недопустимый тип ресурса' })
	readonly aceTaskDataType: ACETaskDataType
}
