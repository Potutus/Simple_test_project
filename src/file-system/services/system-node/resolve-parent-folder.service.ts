import { Injectable, BadRequestException } from '@nestjs/common'
import {
	FSSystemDomain,
	FSSystemTag,
} from 'src/file-system/entities/file-system-node.model'
import { SystemFolderService } from './system-node.service'

@Injectable()
export class ResolveParentService {
	constructor(private readonly systemFolders: SystemFolderService) {}

	async resolve(
		userID: string,
		parentID?: string,
		systemDomain?: FSSystemDomain,
		systemTag?: FSSystemTag
	): Promise<string> {
		if (parentID) {
			return parentID
		}

		this.resolveCoreCheck(systemDomain, systemTag)

		const folderID = await this.systemFolders.ensure(
			userID,
			systemTag,
			systemDomain
		)

		return folderID
	}

	resolveOnlyID(
		userID: string,
		parentID?: string,
		systemDomain?: FSSystemDomain,
		systemTag?: FSSystemTag
	): string {
		if (parentID) {
			return parentID
		}

		this.resolveCoreCheck(systemDomain, systemTag)

		const folderID = this.systemFolders.ensureOnlyID(
			userID,
			systemTag,
			systemDomain
		)

		return folderID
	}

	private resolveCoreCheck(
		systemDomain?: FSSystemDomain,
		systemTag?: FSSystemTag
	) {
		if (!systemDomain || !systemTag) {
			throw new BadRequestException(
				'Не указана точка назначения системной папки'
			)
		}
	}
}
