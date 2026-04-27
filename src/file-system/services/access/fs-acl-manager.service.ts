import { Inject, Injectable, forwardRef } from '@nestjs/common'
import { FsPermissionService } from './fs-permission.service'
import { FSAction } from './fs-node-policy-core.service'
import {
	AclRelation,
	AclResource,
	AclSubject,
} from 'src/access-control/constants/access-control.constants'
import { AccessControlService } from 'src/access-control/access-control.service'
import {
	GrantPermissionDto,
	RevokePermissionDto,
} from 'src/access-control/dto/permission.dto'

export interface ManagePermissionsDto {
	resourceType: AclResource
	resourceID: string
	subjectType: AclSubject
	subjectID: string
	subjectRelation?: AclRelation
	relation: AclRelation
	caveatContext?: Record<string, any>
	expiresAt?: Date
	comment?: string
}

@Injectable()
export class FsAclManagerService {
	constructor(
		@Inject(forwardRef(() => FsPermissionService))
		private readonly permission: FsPermissionService,

		private readonly accessControlService: AccessControlService
	) {}

	async getGranted(userID: string) {
		const result = await this.accessControlService.getGrantedPermissions(
			AclResource.NODE,
			userID
		)

		return result
	}

	async getShared(userID: string) {
		const result = await this.accessControlService.getSharedAccess(
			AclResource.NODE,
			AclResource.USER,
			userID
		)

		return result
	}

	async getListPermissions(userID: string, nodeID: string) {
		const nodeMap = await this.permission.assertPermissionsBatch(userID, [
			{
				action: FSAction.MANAGE,
				sourceID: nodeID,
			},
		])

		const node = nodeMap.get(nodeID)

		const result = await this.accessControlService.listPermissions(
			AclResource.NODE,
			node.id
		)

		return result
	}

	async grantPermissions(
		userID: string,
		opts: Array<ManagePermissionsDto>,
		isOnlySpiceDB: boolean
	) {
		const result = await this.accessControlService.grantPermission(
			opts,
			userID,
			isOnlySpiceDB
		)

		return result
	}

	async revokePermissions(
		userID: string,
		opts: Array<ManagePermissionsDto>,
		isOnlySpiceDB: boolean
	) {
		const result = await this.accessControlService.revokePermission(
			opts,
			userID,
			isOnlySpiceDB
		)

		return result
	}

	async applyAclChanges(
		params: {
			grant: Array<ManagePermissionsDto>
			revoke: Array<ManagePermissionsDto>
		},
		userID: string,
		isOnlySpiceDB: boolean
	) {
		const result = await this.accessControlService.applyAclChanges(
			{
				grant: params.grant,
				revoke: params.revoke,
			},
			userID,
			isOnlySpiceDB
		)

		return result
	}

	/**
	 * Смена родителя узла (Move)
	 * Выполняет атомарную замену связей в Postgres и SpiceDB за один проход.
	 */
	async changeParent(
		params: {
			userID: string
			nodeID: string
			oldParentID: string
			newParentID: string
		},
		isOnlySpiceDB: boolean
	): Promise<void> {
		const { userID, nodeID, oldParentID, newParentID } = params

		if (oldParentID === newParentID) return

		const revoke: RevokePermissionDto[] = [
			{
				resourceType: AclResource.NODE,
				resourceID: oldParentID,
				relation: AclRelation.PARENT,
				subjectType: AclResource.NODE,
				subjectID: nodeID,
			},
		]

		const grant: GrantPermissionDto[] = [
			{
				resourceType: AclResource.NODE,
				resourceID: newParentID,
				relation: AclRelation.PARENT,
				subjectType: AclResource.NODE,
				subjectID: nodeID,
			},
		]

		await this.applyAclChanges({ grant, revoke }, userID, isOnlySpiceDB)
	}

	async createNode(userID: string, nodeID: string, parentID?: string) {
		const permissionsToGrant = new Array<ManagePermissionsDto>()

		permissionsToGrant.push({
			resourceType: AclResource.NODE,
			resourceID: nodeID,
			relation: AclRelation.OWNER,
			subjectType: AclResource.USER,
			subjectID: userID,
		})

		if (parentID) {
			permissionsToGrant.push({
				resourceType: AclResource.NODE,
				resourceID: parentID,
				relation: AclRelation.PARENT,
				subjectType: AclResource.NODE,
				subjectID: nodeID,
			})
		}

		await this.grantPermissions(userID, permissionsToGrant, true)
	}

	async removeNode(userID: string, nodeID: string, parentID?: string) {
		const permissionsToRevoke = new Array<ManagePermissionsDto>()

		permissionsToRevoke.push({
			resourceType: AclResource.NODE,
			resourceID: nodeID,
			relation: AclRelation.OWNER,
			subjectType: AclResource.USER,
			subjectID: userID,
		})

		if (parentID) {
			permissionsToRevoke.push({
				resourceType: AclResource.NODE,
				resourceID: parentID,
				relation: AclRelation.PARENT,
				subjectType: AclResource.NODE,
				subjectID: nodeID,
			})
		}

		await this.revokePermissions(userID, permissionsToRevoke, true)
	}

	async deletionResource(nodeID: string, batchSize?: number) {
		await this.accessControlService.batchResourceDeletion({
			resource: {
				type: AclResource.NODE,
				id: nodeID,
			},
			batchSize: batchSize || 1000,
		})
	}

	async switchInheritPermission(userID: string, nodeID: string, isInherit) {
		if (isInherit) {
			await this.grantPermissions(
				userID,
				[
					{
						resourceType: AclResource.NODE,
						resourceID: nodeID,
						relation: AclRelation.BLOCK_INHERIT,
						subjectType: AclResource.USER,
						subjectID: '*',
					},
				],
				false
			)
		} else {
			await this.revokePermissions(
				userID,
				[
					{
						resourceType: AclResource.NODE,
						resourceID: nodeID,
						relation: AclRelation.BLOCK_INHERIT,
						subjectType: AclResource.USER,
						subjectID: '*',
					},
				],
				false
			)
		}
	}
}
