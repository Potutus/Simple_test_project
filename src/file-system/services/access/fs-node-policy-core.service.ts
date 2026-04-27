import {
	BadRequestException,
	ConflictException,
	ForbiddenException,
	Injectable,
	Logger,
} from '@nestjs/common'

import {
	FSMetadataCategoryType,
	FSNodeType,
	FSSystemTag,
	FileSystemNode,
} from '../../entities/file-system-node.model'
import { OperationRequirement, RequirementType } from './fs-permission.service'
import { AclPermission } from 'src/access-control/constants/access-control.constants'

export enum FSAction {
	CREATE_FOLDER = 'CREATE_FOLDER',
	CREATE_FILE = 'CREATE_FILE',
	CREATE_LINK = 'CREATE_LINK',

	READ = 'READ',
	MOVE = 'MOVE',
	UPDATE = 'UPDATE',
	DELETE = 'DELETE',
	HARD_DELETE = 'HARD_DELETE',

	MANAGE = 'MANAGE',
	RESTORE = 'RESTORE',
}

export interface FSAdditionalParam {
	targetParent?: FileSystemNode
	systemCall?: boolean
}

type RuleHandler = (
	action: FSAction,
	node: FileSystemNode,
	opts?: FSAdditionalParam
) => void

@Injectable()
export class FSNodePolicyService {
	private readonly logger = new Logger(FSNodePolicyService.name)
	/*
    |--------------------------------------------------------------------------
    | PUBLIC ENTRY
    |--------------------------------------------------------------------------
    */

	collectRequirements(
		userID: string,
		action: FSAction,
		source: FileSystemNode,
		targetParent?: FileSystemNode,
		opts?: {
			onlyParentCheck?: boolean
		}
	): OperationRequirement[] {
		let requirements: OperationRequirement[] = new Array()
		const { onlyParentCheck } = opts

		//надо доработать чтобы почище выглядело

		if (onlyParentCheck) {
			this.assertAllowed(action, targetParent)
		} else {
			this.assertAllowed(action, source, { targetParent: targetParent })
		}

		let res = this.systemOwnershipCheck(
			userID,
			source,
			targetParent,
			onlyParentCheck
		)
		if (res) {
			return requirements
		}

		if (onlyParentCheck) {
			requirements = this.caseRequirementsCollect(action, targetParent)
		} else {
			requirements = this.caseRequirementsCollect(action, source, targetParent)
		}

		return requirements
	}

	assertAllowed(
		action: FSAction,
		node: FileSystemNode,
		opts?: FSAdditionalParam
	) {
		this.assertNotSystemLink(node)

		if (
			(action === FSAction.RESTORE || action === FSAction.HARD_DELETE) &&
			!node.deletedAt
		) {
			throw new BadRequestException(
				'Файл не в корзине нельзя восстановить/удалить'
			)
		}

		if (node.deletedAt) {
			this.assertTrashedRules(action)
		}

		if (opts?.targetParent) {
			this.assertMoveRules(node, opts?.targetParent)
		}

		if (node.isSystem) {
			this.systemTagRules[node.systemTag]?.(action, node, opts)
		}
	}

	private systemOwnershipCheck(
		userID: string,
		source: FileSystemNode,
		targetParent?: FileSystemNode,
		onlyParentCheck?: boolean
	): boolean {
		if (source?.isSystem && source?.ownerID === userID) {
			return true
		}

		if (
			onlyParentCheck &&
			targetParent?.isSystem &&
			targetParent?.ownerID === userID
		) {
			return true
		}

		return false
	}

	private caseRequirementsCollect(
		action: FSAction,
		source: FileSystemNode,
		targetParent?: FileSystemNode
	): OperationRequirement[] {
		const requirements: OperationRequirement[] = new Array()

		switch (action) {
			case FSAction.MOVE:
				requirements.push({
					type: RequirementType.ACL,
					nodeID: source.id,
					permission: AclPermission.EDIT,
				})

				requirements.push({
					type: RequirementType.ACL,
					nodeID: targetParent?.id,
					permission: AclPermission.EDIT,
				})

				requirements.push({
					type: RequirementType.SUBTREE,
					sourceID: source.id,
					targetParentID: targetParent?.id,
				})

				break

			case FSAction.CREATE_FILE:
			case FSAction.CREATE_FOLDER:
			case FSAction.CREATE_LINK:
			case FSAction.UPDATE:
				requirements.push({
					type: RequirementType.ACL,
					nodeID: source.id,
					permission: AclPermission.EDIT,
				})
				break

			case FSAction.MANAGE:
				requirements.push({
					type: RequirementType.ACL,
					nodeID: source.id,
					permission: AclPermission.MANAGE_ACCESS,
				})
				break

			case FSAction.READ:
				requirements.push({
					type: RequirementType.ACL,
					nodeID: source.id,
					permission: AclPermission.VIEW,
				})
				break

			case FSAction.RESTORE:
				requirements.push({
					type: RequirementType.ACL,
					nodeID: source.id,
					permission: AclPermission.RESTORE,
				})
				break

			case FSAction.DELETE:
				requirements.push({
					type: RequirementType.ACL,
					nodeID: source.id,
					permission: AclPermission.DELETE,
				})
				break

			case FSAction.HARD_DELETE:
				requirements.push({
					type: RequirementType.ACL,
					nodeID: source.id,
					permission: AclPermission.HARD_DELETE,
				})
				break
		}

		return requirements
	}

	/*
    |--------------------------------------------------------------------------
    | GLOBAL RULES
    |--------------------------------------------------------------------------
    */

	private assertNotSystemLink(node: FileSystemNode) {
		if (
			node.isLink &&
			node?.metadata?.link?.category !== FSMetadataCategoryType.NOT_SYSTEM
		) {
			throw new ConflictException('Узлы системных ссылок переносить нельзя')
		}
	}

	private assertTrashedRules(action: FSAction) {
		if (action !== FSAction.HARD_DELETE && action !== FSAction.RESTORE) {
			throw new ForbiddenException('Удалённый узел нельзя использовать')
		}
	}

	private assertMoveRules(
		source: FileSystemNode,
		targetParent: FileSystemNode
	) {
		if (targetParent?.nodeType !== FSNodeType.FOLDER) {
			throw new ConflictException('Узел назначения должен быть папкой')
		}

		if (source.id === targetParent?.id) {
			throw new ConflictException('Нельзя переместить узел в самого себя')
		}

		if (source.parentID === targetParent?.id) {
			throw new ConflictException(
				'Узел назначения уже является родительской папкой'
			)
		}
	}

	/*
    |--------------------------------------------------------------------------
    | SYSTEM TAG STRATEGY MAP
    |--------------------------------------------------------------------------
    */

	private systemTagRules: Record<FSSystemTag, RuleHandler> = {
		[FSSystemTag.ROOT]: (action) => {
			switch (action) {
				case FSAction.READ:
				case FSAction.CREATE_LINK:
				case FSAction.CREATE_FILE:
				case FSAction.CREATE_FOLDER:
					return

				default:
					throw new ForbiddenException('Системный узел нельзя изменять')
			}
		},
		[FSSystemTag.TRASH]: this.readOnlyRule,
		[FSSystemTag.DOMAIN]: this.readOnlyRule,
		[FSSystemTag.SHARED]: this.readOnlyRule,

		[FSSystemTag.FAVORITES]: (action, node) => {
			if (action !== FSAction.CREATE_LINK && action !== FSAction.READ) {
				throw new ForbiddenException('Избранное только для чтения')
			}
		},

		[FSSystemTag.ALBUMS]: (action) => {
			if (action !== FSAction.READ && action !== FSAction.CREATE_FOLDER) {
				throw new ForbiddenException('Узел альбомов только для папок')
			}
		},

		[FSSystemTag.ALBUM]: (action) => {
			switch (action) {
				case FSAction.READ:
				case FSAction.CREATE_LINK:
				case FSAction.DELETE:
				case FSAction.UPDATE:
				case FSAction.MANAGE:
					return

				case FSAction.MOVE:
					throw new ForbiddenException('Альбом не может быть перемещён')

				default:
					throw new ForbiddenException('В альбоме доступны только ссылки')
			}
		},
	}

	private readOnlyRule(action: FSAction) {
		if (action !== FSAction.READ) {
			throw new ForbiddenException('Системный узел только для чтения')
		}
	}
}
