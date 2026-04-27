import {
	Controller,
	Post,
	Delete,
	Get,
	Body,
	Query,
	Param,
	UsePipes,
	ValidationPipe,
} from '@nestjs/common'
import { AccessControlService } from './access-control.service'
import { GrantPermissionDto, RevokePermissionDto } from './dto/permission.dto'
import {
	AclPermission,
	AclResource,
} from './constants/access-control.constants'
import { Authorization } from 'src/auth/decorator/auth.decorator'
import { Authorized } from 'src/auth/decorator/authorizaed.decorator'

@Controller('acl')
export class AccessControlController {
	constructor(private readonly acl: AccessControlService) {}

	// ============================================================
	// GRANT PERMISSION
	// ============================================================
	/**
	 * Выдать права доступа.
	 * SQL (audit) + SpiceDB (engine)
	 */
	@Post('/grant')
	@Authorization()
	@UsePipes(new ValidationPipe({ transform: true }))
	async grant(
		@Authorized('id') userID: string,
		@Body() dtos: GrantPermissionDto[]
	) {
		return this.acl.grantPermission(dtos, userID, false)
	}

	// ============================================================
	// REVOKE PERMISSION
	// ============================================================
	/**
	 * Отозвать права доступа.
	 */
	@Delete('/revoke')
	@Authorization()
	@UsePipes(new ValidationPipe({ transform: true }))
	async revoke(
		@Authorized('id') userID: string,
		@Body() dtos: RevokePermissionDto[]
	) {
		await this.acl.revokePermission(dtos, userID, false)
		return { success: true, message: 'Permission revoked' }
	}

	// ============================================================
	// LIST PERMISSIONS (Audit/UI)
	// ============================================================
	/**
	 * Посмотреть, кто имеет доступ к конкретному ресурсу.
	 * Читает из SQL.
	 */
	@Get('/list/:resourceType/:resourceID')
	@Authorization()
	async list(
		@Param('resourceType') type: AclResource,
		@Param('resourceID') id: string
	) {
		return this.acl.listPermissions(type, id)
	}

	// ============================================================
	// CHECK PERMISSION (The "Can" check)
	// ============================================================
	/**
	 * Тестовый эндпоинт для проверки: "Имеет ли субъект право X к ресурсу Y?"
	 * Читает напрямую из SpiceDB.
	 * Пример: /acl/check?resType=NODE&resId=...&subType=USER&subId=...&action=view
	 */
	@Get('/check')
	@Authorization()
	async check(
		@Query('resType') resType: any,
		@Query('resId') resId: string,
		@Query('subType') subType: any,
		@Query('subId') subId: string,
		@Query('action') action: AclPermission
	) {
		const contextData = {
			now: Math.floor(Date.now() / 1000),
		}

		const hasPermission = await this.acl.can(
			subType,
			subId,
			action,
			resType,
			resId,
			contextData
		)

		return {
			allowed: hasPermission,
			request: { resType, resId, subType, subId, action },
		}
	}

	@Get('/granted')
	@Authorization()
	async getGrantedPermissions(
		@Query('resType') resType: AclResource,
		@Authorized('id') userID: string
	) {
		return await this.acl.getGrantedPermissions(resType, userID)
	}

	@Get('/shared')
	@Authorization()
	async getSharedAccess(
		@Query('resType') resType: AclResource,
		@Query('subType') subType: AclResource,
		@Authorized('id') userID: string
	) {
		return await this.acl.getSharedAccess(resType, AclResource.USER, userID)
	}

	@Get('/resource-subjects')
	@Authorization()
	async getResourceSubjects(
		@Query('resType') resType: AclResource,
		@Query('resID') resID: string,
		@Authorized('id') userID: string
	) {
		return await this.acl.getResourceSubjects(resType, resID, userID)
	}
}
