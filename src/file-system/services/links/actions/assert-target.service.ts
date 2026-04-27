import {
	Injectable,
	NotFoundException,
	BadRequestException,
} from '@nestjs/common'
import { MediaVisibility } from 'src/media/entities/media.model'
import {
	FSLinkType,
	FSNodeType,
} from 'src/file-system/entities/file-system-node.model'
import { FsPermissionService } from '../../access/fs-permission.service'
import { MediaService } from 'src/media/media.service'
import { FSAction } from '../../access/fs-node-policy-core.service'
import {
	getCategoryFromMime,
	getFavoritesSystemDomainFromCategory,
} from '../../core/fs-get-category.service'

@Injectable()
export class AssertTargetService {
	constructor(
		private readonly permissions: FsPermissionService,
		private readonly mediaService: MediaService
	) {}

	async assert(
		userID: string,
		type: FSLinkType,
		id: string,
		checkIsLink?: boolean
	) {
		if (type === FSLinkType.FSNODE) {
			const nodeMap = await this.permissions.assertPermissionsBatch(userID, [
				{
					action: FSAction.READ,
					sourceID: id,
				},
			])

			const node = nodeMap.get(id)

			if (checkIsLink && node.isLink) {
				throw new BadRequestException('Нельзя сделать ссылку из ссылки')
			}

			if (node.nodeType === FSNodeType.FOLDER) {
				throw new BadRequestException('Нельзя сделать ссылку из папки')
			}

			const systemDomain = getFavoritesSystemDomainFromCategory(
				getCategoryFromMime(node.mimeCache)
			)

			return {
				name: node.name,
				description: node.description,
				systemDomain: systemDomain,
			}
		}

		if (type === FSLinkType.MEDIA) {
			const media = await this.mediaService.findById(id)

			if (!media) {
				throw new NotFoundException('Целевого медиа не найдено')
			}

			if (media.ownerID !== userID) {
				const isVisible =
					media.visibility === MediaVisibility.PUBLIC ||
					media.visibility === MediaVisibility.UNLISTED

				if (!isVisible) {
					throw new NotFoundException('Целевого медиа не найдено')
				}
			}

			const systemDomain = getFavoritesSystemDomainFromCategory(media.type)

			return {
				name: media.name,
				description: media.description,
				systemDomain: systemDomain,
			}
		}
	}
}
