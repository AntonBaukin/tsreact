import get from 'lodash/get'
import set from 'lodash/set'
import isNil from 'lodash/isNil'
import isEmpty from 'lodash/isEmpty'
import isPlainObject from 'lodash/isPlainObject'
import every from 'lodash/every'
import { Json } from 'src/utils/objects'

export type TransformClass<Target> = new () => Transform<Target>

export type Path = string | number | (string | number)[]

/**
 * Transformation strategy that takes a JSON object and
 * converts it to else JSON masked as Target type.
 *
 * The key feature is that each field of Transform instance
 * not starting with '$' is treated as a field of the result.
 *
 * All the fields, including the inherited ones,
 * are automatically collected.
 *
 * So, in your class you create get-methods compatible
 * with Target type and use various helpers to access
 * the income data and the resulting instance.
 */
export default class Transform<Target extends Object = Json>
{
	/* Transform */

	static one<Target>(data: Json): Target {
		const Class = this as TransformClass<Target>
		return new Class().$init(data).$transform()
	}

	static many<Target>(data: Array<Json>): Array<Target> {
		const Class = this as TransformClass<Target>
		const tx = new Class()
		return data.map(item => tx.$init(item).$transform())
	}

	/**
	 * Assigns source data and new target instance.
	 * Overwrite it if you need a cleanup before each transformation.
	 */
	$init(data: Json): this {
		this.$data = data
		this.$result = {} as Target
		return this
	}

	$data?: Json

	/**
	 * Current transformation result instance.
	 * Available during the transformation.
	 */
	$result?: Target

	$transform(): Target {
		if (!this.$transformProps) {
			this.$transformProps = this.$traceTransformProps()
		}

		this.$transformProps.forEach((pd, p) => {
			const v: any = pd.get!.call(this)

			if (v !== undefined) {
				set(this.$result!, p, v)
			}
		})

		return this.$result!
	}


	/* Transformation Helpers */

	$get(path: Path): any {
		return get(this.$data, path)
	}

	$string(path: Path): string | undefined {
		const s = this.$get(path)

		if(typeof s !== 'string' || !s.length || !/\S/.test(s)) {
			return undefined
		}

		return s
	}

	$object(path: Path): Object | undefined {
		const o = this.$get(path)
		return typeof o === 'object' && !isEmpty(o) && isPlainObject(o) ? o : undefined
	}

	$array(path: Path): Array<any> | undefined {
		const a = this.$get(path)
		return Array.isArray(a) && !isEmpty(a) ? a : undefined
	}

	$integer(path: Path): number | undefined {
		let v = this.$get(path)

		if(typeof v === 'string') {
			v = parseInt(v)
		}

		return Number.isInteger(v) ? v : undefined
	}

	$number(path: Path): number | undefined {
		let v = this.$get(path)

		if(typeof v === 'string') {
			v = parseFloat(v)
		}

		return Number.isFinite(v) ? v : undefined
	}

	$boolean(path: Path): boolean | undefined {
		const v = this.$get(path)

		if (v === true || v === 'true') {
			return true
		}

		if (v === false || v === 'false') {
			return false
		}

		return undefined
	}

	$sub<Sub>(Class: TransformClass<Sub>, path: Path): Sub | undefined {
		const x = this.$get(path)

		if (typeof x === 'object' && isPlainObject(x)) {
			return new Class().$init(x as Json).$transform()
		}

		return undefined
	}

	$suba<Sub>(Class: TransformClass<Sub>, path: Path): Array<Sub> | undefined {
		const x = this.$get(path)

		if (Array.isArray(x)) {
			if (!x.length) {
				return undefined
			}

			const tx = new Class()
			const r = x.map(item => tx.$init(item as Json).$transform())
			return every(r, isEmpty) ? undefined : r
		}

		return undefined
	}


	/* Transformation Internals */

	$isTargetProperty(name: string, pd: PropertyDescriptor): boolean {
		const { value, get, set } = pd
		return isNil(value) && !!get && !set && !name.startsWith('$')
	}

	$transformProps?: Map<string, PropertyDescriptor>

	$traceTransformProps(): Map<string, PropertyDescriptor> {
		let result = new Map<string, PropertyDescriptor>()
		let o: Object = this

		//~: trace all getters up by the hierarchy
		while(o && Object.getPrototypeOf(o) !== Object.getPrototypeOf(Object)) {
			const ps = new Map<string, PropertyDescriptor>()

			Object.entries(Object.getOwnPropertyDescriptors(o)).forEach(([p, pd]) => {
				if(!result.has(p) && this.$isTargetProperty(p, pd) ) {
					ps.set(p, pd)
				}
			})

			o = Object.getPrototypeOf(o)

			//~: place inherited properties to be the first in the overall order
			result = new Map<string, PropertyDescriptor>([
				...ps.entries(),
				...result.entries()
			])
		}

		return result
	}
}
