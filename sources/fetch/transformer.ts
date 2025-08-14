import { expectNotNil, expectTrue, expectNever } from 'sources/asserts'
import { isBoolean, isString, isNil, get, set } from 'sources/lodash'
import { asTransform, isTransform, Transform } from './types'

export type ITransformer <D extends {}> = {
  readonly [K in keyof D]: D[K]
}

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
 *
 * NOTE: each concrete class implements ITransformer<D>!
 */
export abstract class Transformer<D extends {}>
{
  readonly $data: any

  readonly $result: D = {} as D

  constructor(source: any) {
    this.$data = source
  }

  /* Transformation Helpers */

  $get(path: GetPath): any {
    return get(this.$data, path)
  }

  $msgFailure(path: GetPath, expect: string, value: any) {
    return `".${path}" ${expect}: ${value}`
  }

  $string(path: GetPath): string {
    const s = this.$get(path)

    expectTrue(
      isString(s),
      () => this.$msgFailure(path, 'is nil or is not a string', s),
    )

    return s
  }

  $stringOrNil(path: GetPath): string | undefined | null {
    const s = this.$get(path)

    if (isNil(s)) {
      return s
    }

    expectTrue(
      isString(s),
      () => this.$msgFailure(path, 'is not a string', s),
    )

    return s
  }

  $number(path: GetPath): number {
    const v = this.$get(path)

    expectTrue(
      Number.isFinite(v),
      () => this.$msgFailure(path, 'is nil or is not a finite number', v),
    )

    return v
  }

  $numberOrNil(path: GetPath): number | undefined | null {
    let v = this.$get(path)

    if (isNil(v)) {
      return v
    }

    if (isString(v)) {
      v = Number(v)
    }

    expectTrue(
      Number.isFinite(v),
      () => this.$msgFailure(path, 'is not a finite number', v),
    )

    return v
  }

  $integer(path: GetPath): number {
    const v = this.$get(path)

    expectTrue(
      Number.isFinite(v) && Number.isInteger(v),
      () => this.$msgFailure(path, 'is nil or is not an integer number', v),
    )

    return v
  }

  $integerOrNil(path: GetPath): number | undefined | null {
    let v = this.$get(path)

    if (isNil(v)) {
      return v
    }

    if (isString(v)) {
      v = Number(v)
    }

    expectTrue(
      Number.isFinite(v) && Number.isInteger(v),
      () => this.$msgFailure(path, 'is not an integer number', v),
    )

    return v
  }

  $boolean(path: GetPath): boolean {
    const v = this.$get(path)

    expectTrue(
      isBoolean(v),
      () => this.$msgFailure(path, 'is nil is not a true or false', v),
    )

    return v
  }

  $booleanOrNil(path: GetPath): boolean | undefined | null {
    let v = this.$get(path)

    if (isNil(v)) {
      return v
    }

    if (isString(v)) {
      v = v === 'true' ? true : v === 'false' ? false : null
    }

    expectTrue(
      isBoolean(v),
      () => this.$msgFailure(path, 'is not a true or false', v),
    )

    return v
  }

  $objectOptional<X extends {}>(T: Transform<X> | TransformerClass<X>):
    AutoGetter<D, X | undefined>
  {
    return function (path: GetPath) {
      const x = this.$get(path)

      if (isNil(x)) {
        return undefined
      }

      if(isTransform<X>(T)) {
        return T(x)
      } else {
        const t = new T(x)
        t.$transform()
        return t.$result
      }
    }
  }

  $object<X extends {}>(T: Transform<X> | TransformerClass<X>): AutoGetter<D, X> {
    const $o = this.$objectOptional(T)

    return function (path: GetPath) {
      return expectNotNil(
        $o.call(this, path),
        () => this.$msgFailure(path, 'is not an object', this.$get(path)),
      )
    }
  }

  $arrayOptional<X extends {}>(T: Transform<X> | TransformerClass<X>):
    AutoGetter<D, X[] | undefined>
  {
    return function (path: GetPath) {
      const x = this.$get(path)

      if (isNil(x)) {
        return undefined
      }

      if (!Array.isArray(x)) {
        expectNever(() => this.$msgFailure(path, 'is not an array', x))
      } else {
        if(isTransform<X>(T)) {
          return x.map(T)
        } else {
          return x.map(i => {
            const t = new T(i)
            t.$transform()
            return t.$result
          })
        }
      }
    }
  }

  $array<X extends {}>(T: Transform<X> | TransformerClass<X>): AutoGetter<D, X[]> {
    const $o = this.$arrayOptional(T)

    return function (path: GetPath) {
      return expectNotNil(
        $o.call(this, path),
        () => this.$msgFailure(path, 'is not an array', this.$get(path)),
      )
    }
  }


  /* Transformation Internals */

  private $transformed = false

  $transform() {
    expectTrue(!this.$transformed)
    this.$transformed = true

    this.$transformProps.forEach((pd, p) => {
      const v: any = pd.get!.call(this)

      if (v !== undefined) {
        set(this.$result, p, v)
      }
    })
  }

  private get $transformProps(): TransformProps {
    const pc = Object.getPrototypeOf(this).constructor

    if (!pc.$transformPropsCache) {
      pc.$transformPropsCache = this.$buildTransformProps()
    }

    return pc.$transformPropsCache as TransformProps
  }

  protected $isTargetProperty(name: string, pd: PropertyDescriptor): boolean {
    const { value, get, set } = pd
    return isNil(value) && !!get && !set && !name.startsWith('$')
  }

  private $buildTransformProps(): TransformProps {
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

export type TransformerClass<D extends {}> = new (source: any) => Transformer<D>

export type TransformProps = Map<string, PropertyDescriptor>

export type GetPath = string | number | (string | number)[]

export type AutoGetter<D extends {}, X> = (this: Transformer<D>, path: GetPath) => X

export type AutoGetPair<D extends {}, K extends keyof D> = readonly [
  undefined | null | GetPath,
  AutoGetter<D, D[K]> | Transform<D>,
]

export type AutoTransforms <D extends {}> = {
  readonly [K in keyof D]: null | AutoGetPair<D, K>
}

export abstract class AutoTransformer<D extends {}> extends Transformer<D>
{
  abstract readonly $auto: AutoTransforms<D>

  $transform() {
    this.$autoExtendProto()
    super.$transform()
  }

  private $autoExtendProto() {
    const proto = Object.getPrototypeOf(this)

    if (!proto.$autoExtended) {
      proto.$autoExtended = true
      this.$autoExtend(proto)
    }
  }

  protected $autoExtend(proto: any) {
    const keys = Object.keys(this.$auto) as Array<keyof D>

    for (const k of keys) {
      const a = this.$auto[k]

      if (!a) {
        continue
      }

      if (Object.getOwnPropertyDescriptor(proto, k)) {
        continue
      }

      const [path, getter] = a

      Object.defineProperty(
        proto,
        k,
        {
          enumerable: true,
          configurable: true,
          get: function () {
            if (isTransform<D>(getter)) {
              return getter(this.$get(path ?? (k as string)))
            } else {
              return getter.call(this, path ?? (k as string))
            }
          },
        },
      )
    }
  }
}

export const autoTransform = <D extends {}, S = any> (
  makeAuto: (self: Transformer<D>) => AutoTransforms<D>,
): Transform<D> => {
  class LocalAutoTransformer extends AutoTransformer<D> {
    readonly $auto = makeAuto(this)
  }

  return toTransform(LocalAutoTransformer)
}

export const toTransform = <D extends {}> (
  Class: TransformerClass<D>,
): Transform<D> => asTransform((source: any): D => {
  const tr = new Class(source)
  tr.$transform()
  return tr.$result
})

export const trNumber = asTransform<number>((x: any) => {
  if (isString(x)) {
    x = Number(x)
  }

  if (Number.isFinite(x)) {
    return x
  } else {
    expectNever(() => `${x} is not a number, or string number`)
  }
})

export const trInteger = asTransform<number>((x: any) => {
  if (isString(x)) {
    x = Number(x)
  }

  if (Number.isFinite(x) && Number.isInteger(x)) {
    return x
  } else {
    expectNever(() => `${x} is not an integer number, or string integer`)
  }
})

export const trString = asTransform<string>((x: any) => {
  expectTrue(isString(x), () => `${x} is not a string`)
  return x
})
