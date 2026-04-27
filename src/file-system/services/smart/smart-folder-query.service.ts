// src/fs/smart/smart-folder-query.service.ts
import {
	Injectable,
	NotFoundException,
	ForbiddenException,
} from '@nestjs/common'
import { InjectModel } from '@nestjs/sequelize'
import { Op } from 'sequelize'

import { SmartFolderCompiler } from './smart-folder-compiler'
import { FsAclManagerService } from '../access/fs-acl-manager.service'
import { FSSmartFolder } from '../../entities/file-system-smart-folder.model'
import { FileSystemNode } from '../../entities/file-system-node.model'
import { FsPermissionService } from '../access/fs-permission.service'
import { FS_ACL_MASK } from 'src/utils/permissions/fs-permissions.config,'
import { AclPermission } from 'src/access-control/constants/access-control.constants'

@Injectable()
export class SmartFolderQueryService {
	constructor(
		@InjectModel(FSSmartFolder)
		private readonly smartModel: typeof FSSmartFolder,

		@InjectModel(FileSystemNode)
		private readonly nodeModel: typeof FileSystemNode,

		private readonly acl: FsAclManagerService,
		private readonly fsPermissionService: FsPermissionService
	) {}

	async execute(opts: {
		smartFolderID: string
		actorID: string
		limit?: number
		afterSortKey?: string
		order?: 'ASC' | 'DESC'
	}) {
		const {
			smartFolderID,
			actorID,
			limit = 50,
			afterSortKey = null,
			order = 'ASC',
		} = opts

		const sf = await this.smartModel.findByPk(smartFolderID)
		if (!sf) throw new NotFoundException()

		// check owner
		if (String(sf.ownerID) !== String(actorID)) throw new ForbiddenException()

		const compiled = SmartFolderCompiler.compile(sf.query, {
			ownerID: sf.ownerID,
		})

		const where = compiled.where || {}
		if (afterSortKey) {
			where['sortKey'] =
				order === 'ASC' ? { [Op.gt]: afterSortKey } : { [Op.lt]: afterSortKey }
		}

		const rows = await this.nodeModel.findAll({
			where,
			include: compiled.include ?? [],
			limit,
			order: [['sortKey', order]],
		})

		// ACL filtering
		const out = []
		for (const node of rows) {
			const can = await this.fsPermissionService.hasPermission(
				actorID,
				node.id,
				AclPermission.VIEW
			)

			if (can) {
				out.push(node)
			}
		}

		return out
	}
}
