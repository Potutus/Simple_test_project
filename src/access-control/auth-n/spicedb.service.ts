import {
	Injectable,
	OnModuleInit,
	Logger,
	BadRequestException,
} from '@nestjs/common'
import { v1 as authzed } from '@authzed/authzed-node'
import { ConfigService } from '@nestjs/config'
import { getSpiceDBSchema } from '../constants/spicedb-schema'
import { parseBoolean } from 'src/libs/common/utils/parse-boolean.utils'

/**
 * Описание любого объекта (Ресурса или Субъекта)
 */
export interface SpiceObject {
	type: string
	id: string
	relation?: string
}

/**
 * Описание операции изменения прав
 */
export interface PermissionOp {
	resource: SpiceObject
	relation?: string
	subject?: SpiceObject

	caveat?: {
		name: string
		context: Record<string, any>
	}

	batchSize?: number
}

export interface PermissionCheck {
	resource: SpiceObject
	permission: string
	subject: SpiceObject

	context?: Record<string, any>
}

export interface SpiceDbBatchOp extends PermissionOp {
	operation: 'TOUCH' | 'DELETE' | 'CREATE'
}

@Injectable()
export class SpiceDBService implements OnModuleInit {
	private client: authzed.ZedClientInterface
	private readonly logger = new Logger(SpiceDBService.name)
	private maxCheckCount
	private maxWriteCount

	constructor(private readonly configService: ConfigService) {}

	onModuleInit() {
		this.maxCheckCount = +this.configService.getOrThrow<number>(
			'SPICEDB_MAX_PERM_CHECK_COUNT'
		)
		this.maxWriteCount = +this.configService.getOrThrow<number>(
			'SPICEDB_MAX_WRITE_COUNT'
		)

		const spiceKey = this.configService.getOrThrow<string>(
			'SPICEDB_PRESHARED_KEY'
		)
		const spiceEndpoint = this.configService.getOrThrow<string>(
			'SPICEDB_GRPC_ENDPOINT'
		)

		this.client = authzed.NewClient(
			spiceKey,
			spiceEndpoint,
			authzed.ClientSecurity.INSECURE_LOCALHOST_ALLOWED
		)

		const schema = getSpiceDBSchema()
		this.applySchemaSafely(schema)
	}

	async checkHealth(): Promise<boolean> {
		// Пустой запрос на чтение схемы — это легкая операция для "пинга"
		const request = authzed.ReadSchemaRequest.create({})

		return new Promise((resolve) => {
			this.client.readSchema(request, (err) => {
				if (err) {
					this.logger.warn(`SpiceDB Health Check Failed: ${err.message}`)
					resolve(false)
				} else {
					resolve(true)
				}
			})
		})
	}

	/**
	 * Читает текущую схему из SpiceDB
	 */
	async readSchema(): Promise<string> {
		const request = authzed.ReadSchemaRequest.create({})
		return new Promise((resolve, reject) => {
			this.client.readSchema(request, (err, response) => {
				if (err) return reject(err)
				resolve(response?.schemaText || '')
			})
		})
	}

	/**
	 * "Умная" запись схемы с проверкой изменений
	 */
	async applySchemaSafely(schemaText: string): Promise<{ updated: boolean }> {
		const currentSchema = await this.readSchema()

		const normalize = (s: string) => s.replace(/\s+/g, ' ').trim()

		if (normalize(currentSchema) === normalize(schemaText)) {
			this.logger.log('Schema is up to date, skipping update.')
			return { updated: false }
		}

		const isLocked = parseBoolean(
			this.configService.get<string>('SPICEDB_SCHEMA_LOCKED')
		)
		if (isLocked) {
			this.logger.warn(
				'Schema change detected, but SPICEDB_SCHEMA_LOCKED is active. Update aborted.'
			)
			return { updated: false }
		}

		const writeSchemaRequest = authzed.WriteSchemaRequest.create({
			schema: schemaText,
		})

		return new Promise((resolve, reject) => {
			this.client.writeSchema(writeSchemaRequest, (err) => {
				if (err) {
					this.logger.error(`SpiceDB SchemaWrite Error: ${err.message}`)
					reject(err)
				} else {
					this.logger.log(`SpiceDB SchemaWrite updated`)
					resolve({
						updated: true,
					})
				}
			})
		})
	}

	/**
	 * Создание или обновление связи (TOUCH)
	 */
	async addRelationship(ops: Array<PermissionOp>): Promise<void> {
		return this.writeOp(ops, authzed.RelationshipUpdate_Operation.TOUCH)
	}

	/**
	 * Удаление связи (DELETE)
	 */
	async removeRelationship(ops: Array<PermissionOp>): Promise<void> {
		return this.writeOp(ops, authzed.RelationshipUpdate_Operation.DELETE)
	}

	/**
	 * Внутренний метод выполнения операции
	 */
	private async writeOp(
		ops: Array<PermissionOp>,
		operation: authzed.RelationshipUpdate_Operation
	): Promise<void> {
		if (!ops.length) {
			return
		}

		if (ops.length > this.maxWriteCount) {
			throw new BadRequestException('Кол-во связей за раз слишком велико.')
		}

		const updates = ops.map((op) => {
			let caveatPayload = undefined
			if (op.caveat) {
				caveatPayload = authzed.ContextualizedCaveat.create({
					caveatName: op.caveat.name,
					context: authzed.createStructFromObject(op.caveat.context || {}),
				})
			}

			const update = authzed.RelationshipUpdate.create({
				operation: operation,
				relationship: authzed.Relationship.create({
					resource: authzed.ObjectReference.create({
						objectType: op.resource.type,
						objectId: op.resource.id,
					}),
					relation: op.relation,
					subject: authzed.SubjectReference.create({
						object: authzed.ObjectReference.create({
							objectType: op.subject.type,
							objectId: op.subject.id,
						}),
						optionalRelation: op.subject.relation || '',
					}),
					optionalCaveat: caveatPayload,
				}),
			})

			return update
		})

		const request = authzed.WriteRelationshipsRequest.create({
			updates: updates,
		})

		return new Promise((resolve, reject) => {
			this.client.writeRelationships(request, (err) => {
				if (err) {
					this.logger.error(
						`SpiceDB Write Error [${operation}]: ${err.message}`
					)
					reject(err)
				} else {
					resolve()
				}
			})
		})
	}

	/**
	 * Массовый метод удаления ресурсов spiceDB
	 */
	async batchDeletionResource(op: PermissionOp): Promise<void> {
		if (!op.resource.type) {
			throw new BadRequestException('Тип ресурса обязателен')
		}

		if (!op.resource.id) {
			throw new BadRequestException('Индетификатор ресурса обязателен')
		}

		this.logger.log(
			`Starting full relationship deletion for ${op.resource.type}:${op.resource.id}`
		)

		await this.deleteByResource(op.resource, op.batchSize)
		await this.deleteBySubject(op.resource, op.batchSize)

		this.logger.log(
			`Finished full relationship deletion for ${op.resource.type}:${op.resource.id}`
		)
	}

	/**
	 * Удалить где ресурс - X
	 * @param resource - X
	 * @param batchSize - лимит на удаление
	 */
	async deleteByResource(resource: SpiceObject, batchSize: number) {
		const request = authzed.DeleteRelationshipsRequest.create({
			relationshipFilter: {
				resourceType: resource.type,
				optionalResourceId: resource.id,
			},
			optionalLimit: batchSize,
			optionalAllowPartialDeletions: true,
		})

		const response = await this.promisifiedDelete(request)

		const deleted = parseInt(response.relationshipsDeletedCount, 10) ?? 0

		this.logger.log(
			`Deleted ${deleted} relationships where resource=${resource.type}:${resource.id}`
		)
		return deleted
	}

	/**
	 * Удалить где субъект - X
	 * @param resource - X
	 * @param batchSize - лимит на удаление
	 */
	async deleteBySubject(resource: SpiceObject, batchSize: number) {
		const request = authzed.DeleteRelationshipsRequest.create({
			relationshipFilter: {
				optionalSubjectFilter: {
					subjectType: resource.type,
					optionalSubjectId: resource.id,
				},
			},
			optionalLimit: batchSize,
			optionalAllowPartialDeletions: true,
		})

		const response = await this.promisifiedDelete(request)

		const deleted = parseInt(response.relationshipsDeletedCount, 10) ?? 0

		this.logger.log(
			`Deleted ${deleted} relationships where subject=${resource.type}:${resource.id}`
		)

		return deleted
	}

	/**
	 * Promisified wrapper
	 */
	private promisifiedDelete(
		request: authzed.DeleteRelationshipsRequest
	): Promise<authzed.DeleteRelationshipsResponse> {
		const type = request.relationshipFilter.resourceType
			? 'resource'
			: 'subject'

		return new Promise((resolve, reject) => {
			this.client.deleteRelationships(request, (err, response) => {
				if (err) {
					reject(err)
				} else {
					this.logger.log(
						`Delete relationships type:${type} response = deletion progress:${response.deletionProgress}; deletion count: ${response.relationshipsDeletedCount}`
					)
					resolve(response)
				}
			})
		})
	}

	/**
	 * Выполнить пакет смешанных операций за один запрос
	 */
	async executeBatch(ops: Array<SpiceDbBatchOp>): Promise<void> {
		if (!ops.length) return
		if (ops.length > this.maxWriteCount) {
			throw new BadRequestException(
				'Превышен лимит операций SpiceDB за один запрос'
			)
		}

		const updates = ops.map((op) => {
			let authzedOp: authzed.RelationshipUpdate_Operation
			switch (op.operation) {
				case 'DELETE':
					authzedOp = authzed.RelationshipUpdate_Operation.DELETE
					break
				case 'TOUCH':
					authzedOp = authzed.RelationshipUpdate_Operation.TOUCH
					break
				case 'CREATE':
					authzedOp = authzed.RelationshipUpdate_Operation.CREATE
					break
				default:
					authzedOp = authzed.RelationshipUpdate_Operation.TOUCH
			}

			let caveatPayload = undefined
			if (op.caveat) {
				caveatPayload = authzed.ContextualizedCaveat.create({
					caveatName: op.caveat.name,
					context: authzed.createStructFromObject(op.caveat.context || {}),
				})
			}

			return authzed.RelationshipUpdate.create({
				operation: authzedOp,
				relationship: authzed.Relationship.create({
					resource: authzed.ObjectReference.create({
						objectType: op.resource.type,
						objectId: op.resource.id,
					}),
					relation: op.relation,
					subject: authzed.SubjectReference.create({
						object: authzed.ObjectReference.create({
							objectType: op.subject.type,
							objectId: op.subject.id,
						}),
						optionalRelation: op.subject.relation || '',
					}),
					optionalCaveat: caveatPayload,
				}),
			})
		})

		const request = authzed.WriteRelationshipsRequest.create({
			updates: updates,
		})

		this.logger.debug(`SpiceDB Batch request: ${JSON.stringify(request)}`)

		return new Promise((resolve, reject) => {
			this.client.writeRelationships(request, (err) => {
				if (err) {
					this.logger.error(`SpiceDB Batch Error: ${err.message}`)
					reject(err)
				} else {
					resolve()
				}
			})
		})
	}

	/**
	 * Универсальная проверка.
	 * @param - PermissionCheck[] Если передан массив — выполняет BulkCheck.
	 * @return - boolean[] Возвращает массив булевых значений в том же порядке.
	 */
	async checkBulkPermissions(checks: PermissionCheck[]): Promise<boolean[]> {
		if (!checks.length) return []

		if (checks.length > this.maxCheckCount) {
			throw new BadRequestException('Слишком большое кол-во прав за раз')
		}

		const items = checks.map((check) => {
			const finalContext = { ...(check.context || {}) }

			return authzed.CheckBulkPermissionsRequestItem.create({
				resource: authzed.ObjectReference.create({
					objectType: check.resource.type,
					objectId: check.resource.id,
				}),
				permission: check.permission,
				subject: authzed.SubjectReference.create({
					object: authzed.ObjectReference.create({
						objectType: check.subject.type,
						objectId: check.subject.id,
					}),
					optionalRelation: check.subject.relation || '',
				}),
				context: authzed.createStructFromObject(finalContext),
			})
		})

		const request = authzed.CheckBulkPermissionsRequest.create({
			items: items,
			consistency: authzed.Consistency.create({
				requirement: {
					oneofKind: 'fullyConsistent',
					fullyConsistent: true,
				},
			}),
		})

		return new Promise((resolve, reject) => {
			this.client.checkBulkPermissions(request, (err, response) => {
				if (err) {
					this.logger.error(`SpiceDB Bulk Check Error: ${err.message}`)
					reject(err)
				} else {
					const results = response.pairs.map((pair: any) => {
						if (pair.response?.oneofKind === 'item') {
							return (
								pair.response.item.permissionship ===
								authzed.CheckPermissionResponse_Permissionship.HAS_PERMISSION
							)
						}
						return false
					})
					resolve(results)
				}
			})
		})
	}

	async checkPermission(check: PermissionCheck): Promise<boolean> {
		const [result] = await this.checkBulkPermissions([check])
		return result
	}
}
