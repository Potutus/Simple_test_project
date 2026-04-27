export function pLimit(concurrency: number) {
	const queue: (() => Promise<any>)[] = new Array()
	let active = 0

	const next = () => {
		if (active >= concurrency) return
		if (queue.length === 0) return
		active++
		const fn = queue.shift()!
		fn().finally(() => {
			active--
			next()
		})
	}

	return <T>(fn: () => Promise<T>): Promise<T> =>
		new Promise((resolve, reject) => {
			queue.push(() => fn().then(resolve, reject))
			next()
		})
}
