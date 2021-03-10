import 'jest'
import { deepSet } from './objects'

describe('deepSet', () => {
	const a = { A: 1 }
	Object.freeze(a)

	const b = { B: 'b' }
	Object.freeze(b)

	const state = { a, b }
	Object.freeze(state)

	it('top level field', () => {
		const result = deepSet(state, 'x', { y: 10 })
		expect(result).toEqual({ a, b, x: { y: 10 }})
	})

	it('second level field', () => {
		const result = deepSet(state, 'a.x', { y: 10 })
		expect(result).toEqual({ b, a: { A: 1, x: { y: 10 } } })
	})

	it('new path from the top', () => {
		const result = deepSet(state, 'x.yz.u', 'U')
		expect(result).toEqual({ a, b, x: { yz: { u: 'U'} } })
	})

	it('new path from second level', () => {
		const result = deepSet(state, 'b.y.uv', { m: 8 })
		expect(result).toEqual({ a, b: { B: 'b', y: { uv: { m: 8 } } } })
	})
})
