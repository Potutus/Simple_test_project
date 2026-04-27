import { Injectable } from '@nestjs/common'
import { FsPermissionService } from 'src/file-system/services/access/fs-permission.service'
import { FSAction } from 'src/file-system/services/access/fs-node-policy-core.service'

@Injectable()
export class GetNodeService {
	constructor(private readonly permission: FsPermissionService) {}

	/**
	 * Функция для получние узла ФС
	 * @param actorID
	 * @param nodeID
	 * @returns
	 */
	async get(actorID: string, nodeID: string) {
		const nodeMap = await this.permission.assertPermissionsBatch(actorID, [
			{
				action: FSAction.READ,
				sourceID: nodeID,
			},
		])

		const node = nodeMap.get(nodeID)

		return node
	}
}
