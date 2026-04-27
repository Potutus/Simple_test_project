export class SortKeyService {
	static KEY_LEN = 32
	static DIGITS_BASE = BigInt(36)
	static makeBaseValue(): bigint {
		const now = BigInt(Date.now()) // milliseconds
		// multiply to give room
		return now * BigInt(1000)
	}

	static encode(num: bigint): string {
		const base = SortKeyService.DIGITS_BASE
		let v = num
		const parts: string[] = []
		if (v === BigInt(0)) parts.push('0')
		while (v > 0) {
			const rem = Number(v % base)
			parts.push(SortKeyService.digit(rem))
			v = v / base
		}
		let s = parts.reverse().join('')
		if (s.length < SortKeyService.KEY_LEN) {
			s = s.padStart(SortKeyService.KEY_LEN, '0')
		} else if (s.length > SortKeyService.KEY_LEN) {
			s = s.slice(-SortKeyService.KEY_LEN)
		}
		return s
	}

	static decode(key: string): bigint {
		const base = SortKeyService.DIGITS_BASE
		let res = BigInt(0)
		for (const ch of key) {
			res = res * base + BigInt(SortKeyService.value(ch))
		}
		return res
	}

	static digit(i: number): string {
		if (i < 10) return String(i)
		return String.fromCharCode('a'.charCodeAt(0) + (i - 10))
	}

	static value(ch: string): number {
		const c = ch.charCodeAt(0)
		if (c >= 48 && c <= 57) return c - 48
		return c - 97 + 10
	}

	static generateInitial(): string {
		const base = SortKeyService.makeBaseValue()
		return SortKeyService.encode(base)
	}

	static between(aKey?: string | null, bKey?: string | null): string {
		// want key between a (before) and b (after)
		if (!aKey && !bKey) return this.generateInitial()
		if (!aKey) {
			// put before b -> pick value b - delta
			const b = this.decode(bKey!)
			const v = b - BigInt(1)
			return this.encode(v > 0 ? v : BigInt(0))
		}
		if (!bKey) {
			// put after a -> a + delta
			const a = this.decode(aKey)
			const v = a + BigInt(1)
			return this.encode(v)
		}
		const a = this.decode(aKey)
		const b = this.decode(bKey)
		if (b <= a + BigInt(1)) {
			// no room — fallback to generate a new key as a + 1 (may collide in dense inserts)
			// In production replace with LexoRank lib for fractional rebalances
			return this.encode(a + BigInt(1))
		}
		const mid = (a + b) / BigInt(2)
		return this.encode(mid)
	}
}
