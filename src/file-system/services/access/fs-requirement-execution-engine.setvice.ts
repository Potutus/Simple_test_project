import {
	ConflictException,
	ForbiddenException,
	Inject,
	Injectable,
	forwardRef,
} from '@nestjs/common'
import { AclPermission } from 'src/access-control/constants/access-control.constants'
import {
	FsPermissionService,
	OperationRequirement,
	RequirementType,
	SubtreeRequirement,
} from './fs-permission.service'
import { FileSystemNode } from 'src/file-system/entities/file-system-node.model'

@Injectable()
export class RequirementExecutionEngineService {
	constructor(
		@Inject(forwardRef(() => FsPermissionService))
		private readonly accessService: FsPermissionService
	) {}

	async execute(
		userID: string,
		requirements: OperationRequirement[],
		nodeMap: Map<string, FileSystemNode>
	): Promise<void> {
		const subtreeChecks: SubtreeRequirement[] = new Array()
		const seenAclKeys = new Set<string>()
		const aclChecks: { nodeID: string; permission: AclPermission }[] =
			new Array()

		for (const req of requirements) {
			if (req.type === RequirementType.ACL) {
				const key = `${req.nodeID}:${req.permission}`

				if (!seenAclKeys.has(key)) {
					seenAclKeys.add(key)
					aclChecks.push({ nodeID: req.nodeID, permission: req.permission })
				}
			} else if (req.type === RequirementType.SUBTREE) {
				subtreeChecks.push(req)
			}
		}

		const [aclResults, subtreeResults] = await Promise.all([
			aclChecks.length
				? this.accessService.hasPermissionsBatch(userID, aclChecks)
				: Promise.resolve([]),

			subtreeChecks.length
				? this.accessService.canBatchSubtree(subtreeChecks)
				: Promise.resolve([]),
		])

		for (let i = 0; i < aclResults.length; i++) {
			if (!aclResults[i]) {
				const failed = aclChecks[i]
				const node = nodeMap.get(failed.nodeID)

				throw new ForbiddenException(
					`Нет доступа (${failed.permission}) к объекту ${node?.name}`
				)
			}
		}

		for (const result of subtreeResults) {
			if (result) {
				throw new ConflictException('Нельзя переместить узел в своего потомка')
			}
		}
	}
}
