// src/fs/smart/smart-folder.service.ts
import {
	Injectable,
	BadRequestException,
	NotFoundException,
	ForbiddenException,
} from '@nestjs/common'
import { InjectModel } from '@nestjs/sequelize'
import { SmartFolderCompiler } from './smart-folder-compiler'
import { FsAclManagerService } from '../access/fs-acl-manager.service'
import { FileSystemNode } from '../../entities/file-system-node.model'
import { FSSmartFolder } from '../../entities/file-system-smart-folder.model'

@Injectable()
export class SmartFolderService {
	constructor(
		@InjectModel(FSSmartFolder)
		private readonly smartModel: typeof FSSmartFolder,

		@InjectModel(FileSystemNode)
		private readonly nodeModel: typeof FileSystemNode,

		private readonly acl: FsAclManagerService
	) {}

	async create(dto: {
		nodeID: string
		ownerID: string
		query: any
		options?: any
	}) {
		// Validate that FSNode exists and is owned by user
		const node = await this.nodeModel.findByPk(dto.nodeID)
		if (!node) throw new NotFoundException('FSNode not found')

		if (String(node.ownerID) !== String(dto.ownerID)) {
			throw new ForbiddenException(
				'User cannot attach smart folder to this node'
			)
		}

		// Validate query
		try {
			SmartFolderCompiler.validate(dto.query)
		} catch (err) {
			throw new BadRequestException(`Invalid query: ${err.message}`)
		}

		return this.smartModel.create({
			nodeID: dto.nodeID,
			ownerID: dto.ownerID,
			query: dto.query,
			options: dto.options ?? {},
		})
	}

	async get(id: string, actorID: string) {
		const sf = await this.smartModel.findByPk(id)
		if (!sf) throw new NotFoundException()

		if (String(sf.ownerID) !== String(actorID)) {
			throw new ForbiddenException()
		}

		return sf
	}

	async update(
		id: string,
		actorID: string,
		patch: Partial<{ query: any; options: any }>
	) {
		const sf = await this.smartModel.findByPk(id)
		if (!sf) throw new NotFoundException()

		if (String(sf.ownerID) !== String(actorID)) throw new ForbiddenException()

		if (patch.query) {
			try {
				SmartFolderCompiler.validate(patch.query)
			} catch (e) {
				throw new BadRequestException(`Invalid query: ${e.message}`)
			}
		}

		Object.assign(sf, patch)
		await sf.save()
		return sf
	}

	async delete(id: string, actorID: string) {
		const sf = await this.smartModel.findByPk(id)
		if (!sf) throw new NotFoundException()

		if (String(sf.ownerID) !== String(actorID)) throw new ForbiddenException()

		await sf.destroy()
		return { deleted: true }
	}

	async list(ownerID: string) {
		return this.smartModel.findAll({
			where: { ownerID },
			order: [['createdAt', 'DESC']],
		})
	}
}
