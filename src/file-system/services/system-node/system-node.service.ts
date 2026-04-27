import {
	Injectable,
	InternalServerErrorException,
	Logger,
} from '@nestjs/common'
import { InjectModel } from '@nestjs/sequelize'
import {
	FileSystemCreationAttr,
	FileSystemNode,
	FSNodeType,
	FSSystemDomain,
	FSSystemTag,
} from '../../entities/file-system-node.model'
import { v5 as uuidv5 } from 'uuid'
import { SortKeyService } from '../core/sort-key.service'
import { InternalBusinessException } from 'src/exception/internal-business.exception'

@Injectable()
export class SystemFolderService {
	private readonly logger = new Logger(SystemFolderService.name)

	constructor(
		@InjectModel(FileSystemNode)
		private readonly fsNode: typeof FileSystemNode
	) {}

	// =====================================================================
	// PUBLIC API
	// =====================================================================

	/**
	 * Убедится в наличии родительского элемента
	 * Если нет - создать
	 * И вернуть айди родительского элемента
	 */
	async ensure(
		ownerID: string,
		systemTag: FSSystemTag,
		systemDomain: FSSystemDomain
	): Promise<string> {
		const nodesToInsert = this.createSystemFolderInsert(
			ownerID,
			systemTag,
			systemDomain
		)

		await this.fsNode.bulkCreate(nodesToInsert, {
			ignoreDuplicates: true,
			returning: true,
		})

		return nodesToInsert[nodesToInsert.length - 1].id
	}

	/**
	 * Вернуть только индетификатор родительского элемента
	 */
	ensureOnlyID(
		ownerID: string,
		systemTag: FSSystemTag,
		systemDomain: FSSystemDomain
	): string {
		const parentID = this.generateDeterministicID(
			ownerID,
			systemTag,
			systemDomain
		)

		return parentID
	}

	// =====================================================================
	// РЕКУРСИВНОЕ ПОСТРОЕНИЕ МАССИВА ОБЪЕКТОВ
	// =====================================================================

	/**
	 * Возвращает построенный массив системных папок для вставки
	 */
	private createSystemFolderInsert(
		ownerID: string,
		systemTag: FSSystemTag,
		systemDomain: FSSystemDomain
	): FileSystemCreationAttr[] {
		try {
			const parentTag = this.parentOf(systemTag)
			let parentNodes: FileSystemCreationAttr[] = new Array()
			let parentObj: FileSystemCreationAttr | null = null

			if (parentTag !== null) {
				parentNodes = this.createSystemFolderInsert(
					ownerID,
					parentTag,
					systemDomain
				)
				parentObj = parentNodes[parentNodes.length - 1]
			} else {
				const rootNode = this.ensureSystemRoot(ownerID)
				parentNodes = [rootNode]
				parentObj = rootNode
			}

			const id = this.generateDeterministicID(ownerID, systemTag, systemDomain)
			const name = this.naming(systemTag, systemDomain)

			const currentNode: FileSystemCreationAttr = {
				id: id,
				ownerID,
				parentID: parentObj.id,
				nodeType: FSNodeType.FOLDER,
				isSystem: true,
				isSmart: false,
				isLink: false,
				isInherit: false,
				systemTag,
				systemDomain,
				name: name,
				description: null,
				sortKey: SortKeyService.generateInitial(),
				sizeCache: BigInt(0),
				mimeCache: null,
			}

			return [...parentNodes, currentNode]
		} catch (e) {
			throw new InternalBusinessException('Ошибка при создании системной папки')
		}
	}

	// =====================================================================
	// ROOT
	// =====================================================================

	/**
	 * Возвращает объект ROOT
	 */
	private ensureSystemRoot(ownerID: string): FileSystemCreationAttr {
		try {
			const id = this.generateDeterministicID(
				ownerID,
				FSSystemTag.ROOT,
				FSSystemDomain.ROOT
			)

			const name = this.naming(FSSystemTag.ROOT, FSSystemDomain.ROOT)
			const sortKey = SortKeyService.generateInitial()

			const node = {
				id: id,
				ownerID: ownerID,
				parentID: null,
				nodeType: FSNodeType.FOLDER,
				isSystem: true,
				isSmart: false,
				isLink: false,
				isInherit: false,
				systemTag: FSSystemTag.ROOT,
				systemDomain: FSSystemDomain.ROOT,
				name: name,
				description: null,
				sortKey: sortKey,
				sizeCache: BigInt(0),
				mimeCache: null,
			}

			return node
		} catch (e) {
			throw new InternalBusinessException('Ошибка при создании root папки')
		}
	}

	// =====================================================================
	// ВСПОМОГАТЕЛЬНЫЕ МЕТОДЫ
	// =====================================================================

	/**
	 * Маппинг: определяет родителя для каждой системной папки.
	 */
	private parentOf(tag: FSSystemTag, domain?: FSSystemDomain) {
		switch (tag) {
			case FSSystemTag.DOMAIN:
			case FSSystemTag.TRASH:
			case FSSystemTag.SHARED:
				return null

			case FSSystemTag.FAVORITES:
			case FSSystemTag.ALBUMS:
				return FSSystemTag.DOMAIN

			case FSSystemTag.ALBUM:
				return FSSystemTag.ALBUMS

			default:
				return null
		}
	}

	/**
	 * Человеко-читаемое название системной папки.
	 */
	private naming(tag: FSSystemTag, domain: FSSystemDomain): string {
		switch (tag) {
			case FSSystemTag.DOMAIN:
				return (
					domain.charAt(0).toUpperCase() +
					domain.slice(1, domain.length).toLowerCase()
				)
			default:
				return (
					tag.charAt(0).toUpperCase() + tag.slice(1, tag.length).toLowerCase()
				)
		}
	}

	/**
	 * Генерация предопределённого индетификатора.
	 */
	private generateDeterministicID(
		ownerID: string,
		tag: FSSystemTag,
		domain: FSSystemDomain
	): string {
		const name = `${ownerID}:${tag}:${domain}`
		return uuidv5(name, ownerID)
	}
}
