import { Injectable } from '@nestjs/common'
import { FSLinkType } from '../../entities/file-system-node.model'
import { CreateLinkService } from './actions/create-link.service'

@Injectable()
export class LinkService {
	constructor(private readonly createLinkService: CreateLinkService) {}

	async create(opts: {
		userID: string
		parentID?: string
		name: string
		targetType: FSLinkType
		targetID: string
	}) {
		return await this.createLinkService.create(opts)
	}
}
