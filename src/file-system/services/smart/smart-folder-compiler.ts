// src/fs/smart/smart-folder-compiler.ts
import { Op, WhereOptions, IncludeOptions } from 'sequelize'
import { FSNodeTag } from '../../entities/file-system-node-tag.model'
import { FSTags } from '../../entities/file-system-tag.model'

export class SmartFolderCompiler {
	static ALLOWED_FIELDS = new Set([
		'name',
		'nodeType',
		'sizeCache',
		'mimeCache',
		'createdAt',
		'updatedAt',
		'extension',
		'isLink',
	])

	static validate(query: any) {
		const walk = (node: any) => {
			if (!node) throw new Error('Empty filter node')

			// logical
			if (node.operator) {
				if (!['AND', 'OR', 'NOT'].includes(node.operator))
					throw new Error(`Invalid operator ${node.operator}`)

				if (!Array.isArray(node.conditions))
					throw new Error(`conditions must be array`)

				node.conditions.forEach(walk)
				return
			}

			// condition
			if (!node.field || !node.op)
				throw new Error('Condition must have field & op')

			if (!this.ALLOWED_FIELDS.has(node.field) && node.field !== 'tag')
				throw new Error(`Unsupported field ${node.field}`)

			const allowedOps = [
				'EQ',
				'NE',
				'GT',
				'GTE',
				'LT',
				'LTE',
				'LIKE',
				'ILIKE',
				'IN',
				'HAS',
			]
			if (!allowedOps.includes(node.op))
				throw new Error(`Unsupported op ${node.op}`)
		}

		walk(query)
	}

	static compile(query: any, opts: { ownerID?: string }): any {
		const include: IncludeOptions[] = []
		const whereParts: WhereOptions[] = []

		if (opts.ownerID) {
			whereParts.push({ ownerID: opts.ownerID })
		}

		const walk = (node: any): WhereOptions => {
			if (node.operator) {
				const parts = node.conditions.map(walk)
				if (node.operator === 'AND') return { [Op.and]: parts }
				if (node.operator === 'OR') return { [Op.or]: parts }
				if (node.operator === 'NOT') return { [Op.not]: parts }
			}

			const { field, op, value } = node

			if (field === 'tag') {
				include.push({
					model: FSNodeTag,
					required: true,
					include: [
						{
							model: FSTags,
							required: true,
							where: { name: Array.isArray(value) ? value : [value] },
						},
					],
				})
				return {}
			}

			switch (op) {
				case 'EQ':
					return { [field]: value }
				case 'NE':
					return { [field]: { [Op.ne]: value } }
				case 'GT':
					return { [field]: { [Op.gt]: value } }
				case 'GTE':
					return { [field]: { [Op.gte]: value } }
				case 'LT':
					return { [field]: { [Op.lt]: value } }
				case 'LTE':
					return { [field]: { [Op.lte]: value } }
				case 'LIKE':
					return { [field]: { [Op.like]: `%${value}%` } }
				case 'ILIKE':
					return { [field]: { [Op.iLike]: `%${value}%` } }
				case 'IN':
					return { [field]: { [Op.in]: value } }
			}

			return {}
		}

		const main = walk(query)
		if (Object.keys(main).length) whereParts.push(main)

		return {
			where: whereParts.length ? { [Op.and]: whereParts } : {},
			include: include.length ? include : undefined,
		}
	}
}
