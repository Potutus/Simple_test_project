import { Injectable } from '@nestjs/common'
import {
	FSMetadataType,
	FileSystemNode,
} from '../../entities/file-system-node.model'

@Injectable()
export class FSMetadataService {
	/** Полный replace и сохранить */
	async replaceMetadataAndSave(node: FileSystemNode, newMeta: FSMetadataType) {
		node.metadata = newMeta
		await node.save()
		return node
	}

	/** Глубокий merge поверх существующего и сохранить */
	async mergeMetadataAndSave(node: FileSystemNode, patch: Record<string, any>) {
		node.metadata = {
			...(node.metadata ?? {}),
			...patch,
		}
		await node.save()
		return node
	}

	/** Удалить ключ и сохранить */
	async removeMetadataKeyAndSave(
		node: FileSystemNode,
		key: keyof FSMetadataType
	) {
		if (!node.metadata) {
			return node
		}

		const metaCopy = { ...node.metadata }

		delete metaCopy[key]

		node.metadata = metaCopy

		await node.save()

		return node
	}

	/** Полный replace */
	async replaceMetadata(metadata: FSMetadataType, newMeta: FSMetadataType) {
		metadata = newMeta

		return metadata
	}

	/** Глубокий merge поверх существующего */
	async mergeMetadata(metadata: FSMetadataType, patch: FSMetadataType) {
		metadata = {
			...(metadata ?? {}),
			...patch,
		}

		return metadata
	}

	/** Удалить ключ */
	async removeMetadataKey(metadata: FSMetadataType, key: keyof FSMetadataType) {
		if (!metadata) {
			return metadata
		}

		const metaCopy = { ...metadata }

		delete metaCopy[key]

		return metaCopy
	}
}
