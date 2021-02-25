import get from 'lodash/get'
import set from 'lodash/set'

export type JsonValue = string|number|boolean|null|Json|JsonArray

export interface Json {
	[x: string]: JsonValue
}

export interface JsonArray extends Array<JsonValue> {
}

/**
 * Redux state safe. Replaces deeply the value by the path
 * of format 'a.b.c...' where each item is a string key.
 */
export function deepSet(state: Object, path: string, value: any) {
	const keys = path.split('.')
	let result = state
	let item = result

	keys.forEach((key, i) => {
		if (i === 0) {
			item = result = { ...result }
		}

		if (i === keys.length - 1) {
			set(item, key, value)
		} else {
			let next: unknown = get(item, key)

			if (next === undefined || next === null) {
				next = {}
			} else if (typeof next !== 'object') {
				throw new Error(`Not an object by the key: ${key} of path: ${path}`)
			} else {
				next = { ...next }
			}

			set(item, key, next)
			item = next as Object
		}
	})

	return result
}
