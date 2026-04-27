import { Injectable, Logger } from '@nestjs/common'
import { SoftDeleteService } from './actions/soft-delete.service'
import { RestoreService } from './actions/restore.service'
import { PurgeService } from './actions/purge.service'

@Injectable()
export class TrashService {
	private readonly logger = new Logger(TrashService.name)

	constructor(
		private readonly softDeleteService: SoftDeleteService,
		private readonly restoreService: RestoreService,
		private readonly purgeService: PurgeService
	) {}

	async softDelete(opts: { userID: string; nodeID: string }) {
		return await this.softDeleteService.delete(opts)
	}

	async restore(opts: {
		userID: string
		nodeID: string
		newParentID?: string
	}) {
		return await this.restoreService.restore(opts)
	}

	async purge(opts: { userID: string; nodeID: string }) {
		return await this.purgeService.purge(opts)
	}
}
