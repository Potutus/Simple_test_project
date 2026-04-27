import {
	Injectable,
	ForbiddenException,
	BadRequestException,
	OnModuleInit,
	Logger,
	NotFoundException,
	ConflictException,
	Inject,
	forwardRef,
} from '@nestjs/common'
import { InjectModel } from '@nestjs/sequelize'
import {
	FSSystemDomain,
	FSSystemTag,
	FileSystemNode,
} from '../../entities/file-system-node.model'
import { FSAction, FSNodePolicyService } from './fs-node-policy-core.service'
import { AccessControlService } from 'src/access-control/access-control.service'
import {
	AclPermission,
	AclResource,
	AclSubject,
} from 'src/access-control/constants/access-control.constants'
import { ConfigService } from '@nestjs/config'
import { InternalBusinessException } from 'src/exception/internal-business.exception'
import { RequirementExecutionEngineService } from './fs-requirement-execution-engine.setvice'
import { ResolveParentService } from '../system-node/resolve-parent-folder.service'

export interface AssertCheck {
	nodeID: string
	permission: AclPermission
	fsAction: FSAction
	optional?: {
		targetParentID?: string
	}
}

export interface AssertOperation {
	action: FSAction
	sourceID: string
	targetParentID?: string
	opts?: {
		onlyParentCheck?: boolean
		softDelete?: boolean
	}
}

export interface sNormalizedOperation {
	source: FileSystemNode
	targetParent?: FileSystemNode
	aclChecks: {
		nodeID: string
		permission: AclPermission
	}[]
	subtreeCheck?: {
		sourceID: string
		targetParentID: string
	}
}

export enum RequirementType {
	ACL = 'ACL',
	SUBTREE = 'SUBTREE',
}

export interface AclRequirement {
	type: RequirementType.ACL
	nodeID: string
	permission: AclPermission
}

export interface SubtreeRequirement {
	type: RequirementType.SUBTREE
	sourceID: string
	targetParentID: string
}

export type OperationRequirement = AclRequirement | SubtreeRequirement

@Injectable()
export class FsPermissionService implements OnModuleInit {
	private readonly logger = new Logger(FsPermissionService.name)
	private maxCheckCount

	constructor(
		@InjectModel(FileSystemNode)
		private readonly nodeModel: typeof FileSystemNode,

		@Inject(forwardRef(() => FSNodePolicyService))
		private readonly fsNodePolicyService: FSNodePolicyService,
		private readonly accessControlService: AccessControlService,
		private readonly configService: ConfigService,
		private readonly requirementExecutionEngine: RequirementExecutionEngineService,
		private readonly resolveParentService: ResolveParentService
	) {}

	onModuleInit() {
		this.maxCheckCount = +this.configService.getOrThrow<number>(
			'SPICEDB_MAX_PERM_CHECK_COUNT'
		)
	}

	private getACERequestContext() {
		return {
			now: Math.floor(Date.now() / 1000),
		}
	}

	private checkRequestLength(checks: Array<any>) {
		if (!checks.length) return []

		if (checks.length > this.maxCheckCount) {
			throw new BadRequestException(
				'Превышено кол-во допустимых объектов для проверки'
			)
		}
	}

	/**
	 * МАССОВАЯ ПРОВЕРКА (BATCH)
	 * @param userID Проверяет доступ по субъекту
	 * @param nodeID Принимает массив
	 * @param permission Принимает массив
	 */
	async hasPermissionsBatch(
		userID: string,
		checks: Array<{
			nodeID: string
			permission: AclPermission
		}>
	): Promise<boolean[]> {
		this.checkRequestLength(checks)

		const contextData = this.getACERequestContext()

		const batchRequest = checks.map((check) => ({
			resourceType: AclResource.NODE,
			resourceID: check.nodeID,
			action: check.permission,
			subjectType: AclSubject.USER,
			subjectID: userID,
			contextData: contextData,
		}))

		return this.accessControlService.canBatch(batchRequest)
	}

	/**
	 * МАССОВАЯ ПРОВЕРКА (BATCH)
	 * для проверки переноса в поддерево
	 */

	async canBatchSubtree(
		subtreeChecks: {
			sourceID: string
			targetParentID: string
		}[]
	): Promise<boolean[]> {
		this.checkRequestLength(subtreeChecks)

		const contextData = this.getACERequestContext()

		const batchRequest = subtreeChecks.map((check) => ({
			resourceType: AclResource.NODE,
			resourceID: check.sourceID,
			action: AclPermission.ANCESTORS,
			subjectType: AclSubject.NODE,
			subjectID: check.targetParentID,
			contextData: contextData,
		}))

		return this.accessControlService.canBatch(batchRequest)
	}

	/**
	 * Проверка одного права (Старый метод, теперь использует batch внутри)
	 */
	async hasPermission(
		userID: string,
		nodeID: string,
		permission: AclPermission
	): Promise<boolean> {
		const [result] = await this.hasPermissionsBatch(userID, [
			{ nodeID, permission },
		])
		return result
	}

	/**
	 * МАССОВАЯ ПРОВЕРКА ПРАВ
	 * @param userID
	 * @param operations
	 * @operation:
	 * 4. Оставшихся проверяет ОДНИМ запросом в SpiceDB.
	 */
	async assertPermissionsBatch(
		userID: string,
		operations: AssertOperation[]
	): Promise<Map<string, FileSystemNode>> {
		this.checkRequestLength(operations)

		const uniqueIDs = new Set<string>()
		let isNeedRoot = false
		let RootTargetParent: string

		for (const op of operations) {
			if (!op.opts?.onlyParentCheck) {
				uniqueIDs.add(op.sourceID)
			}

			if (!op.targetParentID) {
				isNeedRoot = true
				const targetParentID = this.resolveParentService.resolveOnlyID(
					userID,
					op.targetParentID,
					FSSystemDomain.ROOT,
					FSSystemTag.ROOT
				)

				uniqueIDs.add(targetParentID)
			} else {
				uniqueIDs.add(op.targetParentID)
			}
		}

		if (isNeedRoot) {
			RootTargetParent = await this.resolveParentService.resolve(
				userID,
				null,
				FSSystemDomain.ROOT,
				FSSystemTag.ROOT
			)
		}

		const nodes = await this.nodeModel.findAll({
			where: { id: Array.from(uniqueIDs) },
		})

		const nodeMap = new Map(nodes.map((n) => [n.id, n]))

		const allRequirements: OperationRequirement[] = new Array()

		for (const op of operations) {
			const source = nodeMap.get(op.sourceID)
			if (!source && !op.opts.onlyParentCheck) {
				throw new BadRequestException(`Узел ${op.sourceID} не найден`)
			}

			const targetParent = op.targetParentID
				? nodeMap.get(op.targetParentID)
				: !op.opts?.softDelete
					? nodeMap.get(RootTargetParent)
					: null

			if (op.targetParentID && !targetParent) {
				throw new BadRequestException(
					`Файл/папка с ID ${op.targetParentID} не найден`
				)
			}

			const requirements = this.fsNodePolicyService.collectRequirements(
				userID,
				op.action,
				source,
				targetParent,
				{
					onlyParentCheck: op?.opts?.onlyParentCheck,
				}
			)

			allRequirements.push(...requirements)
		}

		await this.requirementExecutionEngine.execute(
			userID,
			allRequirements,
			nodeMap
		)

		return nodeMap
	}
}
