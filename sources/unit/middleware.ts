import { produce } from 'immer'
import { Action, Middleware } from 'redux'
import { AppContext, DispatchBase, StateBase } from 'sources/app'
import { expectNever, expectTrue, warn } from 'sources/asserts'
import {
  isFunction,
  isObject,
  isString,
  isFinite,
  isEqual,
  isEmpty,
  isNil,
  get,
  set,
} from 'sources/lodash'
import { UnitsRegistry } from './registry'
import { cloneUnitPayload, makePlainUnit } from './utils'
import {
  DataUnit,
  isDataUnit,
  isOnlyUnit,
  isPayloadUnit,
  isPlainUnit,
  isReduceUnit,
  Payload,
  PlainUnit,
} from './types'

export const unitsReducer = (registry: Map<string, DataUnit>) =>
  <S, A extends Action>(state: S | Partial<S> | undefined, action: A): S => {
    const { type } = action
    const unit = registry.get(type)

    if (isNil(state) || !isReduceUnit(unit)) {
      return state as S
    }

    const { slice, initialState } = unit

    let payload: Payload | null = (action as any).payload
    if (isNil(payload) || isEmpty(payload)) {
      payload = null
    }

    if (slice === true) {
      return produce(state as S, (draft) => {
        let sliceState = get(draft, type)

        if (isNil(sliceState)) {
          sliceState = isFunction(initialState) ? initialState() : (initialState ?? {})
          set(draft as object, type, sliceState)
        }

        const result = unit.reduce(sliceState, payload)
        if (!isNil(result)) {
          set(draft as object, type, result)
        }
      })
    } else if (isString(slice)) {
      if (!state || isNil(state[slice as keyof S])) {
        return state as S
      }

      return produce(state as S, draft => {
        const sliceState = (draft as any)[slice]
        const result = unit.reduce(sliceState, payload)

        if (!isNil(result)) {
          set(draft as object, type, result)
        }
      })
    } else {
      return produce(state as S, draft => {
        const result = unit.reduce(draft as any, payload)

        if (!isNil(result) && isObject(result)) {
          Object.assign(draft as any, result)
        }
      })
    }
  }

class PlainUnits
{
  get(type: string, p?: Payload): PlainUnit {
    const base = this.base(type)
    return p ? cloneUnitPayload(base, p) : base
  }

  private base(type: string): PlainUnit {
    const existing = this.units.get(type)

    if (existing) {
      return existing
    } else {
      const newie = makePlainUnit(type)
      this.units.set(type, newie)
      return newie
    }
  }

  private units = new Map<string, PlainUnit>()
}

export class UnitsTrigger<S extends StateBase, D extends DispatchBase>
{
  constructor (registry: UnitsRegistry<S, D>) {
    this.registry = registry
  }

  private registry: UnitsRegistry<S, D>

  private current: DataUnit | string | undefined

  private queue: DataUnit[] = []

  private typeCycles = new Map<string, number>()

  private plainUnits = new PlainUnits()

  plain (type: string, p?: any) {
    let unit = this.registry.get(type)

    if (unit) {
      if (p) {
        if (!isPayloadUnit(unit) || !isEqual(p, unit.payload)) {
          unit = cloneUnitPayload(unit, p)
        }
      }

      this.enter(unit)
    } else {
      this.enter(this.plainUnits.get(type, p))
    }
  }

  enter (unit: DataUnit) {
    this.incType(unit.type)

    if (this.current) {
      if (this.current === unit) {
        if (this.numType(unit.type) > 2) {
          this.decType(unit.type)
          warn(`Re-dispatching the same Data Unit ${unit.type} more than twice`)
        } else {
          this.queue.push(unit)
        }
      } else {
        this.queue.push(unit)
      }
    } else {
      this.handle(unit)
    }
  }

  private numType (type: string) {
    return this.typeCycles.get(type) ?? 0
  }

  private incType (type: string) {
    this.typeCycles.set(type, 1 + this.numType(type))
  }

  private decType (type: string) {
    const i = this.typeCycles.get(type)

    if (!i) {
      expectNever()
    } else if (i === 1) {
      this.typeCycles.delete(type)
    } else {
      this.typeCycles.set(type, i - 1)
    }
  }

  private handle (unit: DataUnit) {
    const queueLength = this.queue.length

    try {
      this.current = unit
      this.trigger(unit)
      this.leave(unit)
    } catch (e: unknown) {
      this.current = undefined
      this.decType(unit.type)

      if (queueLength > this.queue.length) {
        const removed = this.queue.splice(
          queueLength,
          this.queue.length - queueLength,
        )

        removed.forEach(u => this.decType(u.type))
      }

      if (this.queue.length) {
        this.plan()
      }

      throw e
    }
  }

  private trigger (unit: DataUnit) {
    const followers = this.registry.followers.get(unit.type)

    if (!followers?.size) {
      return
    }

    const p = isPayloadUnit(unit) ? unit.payload : undefined
    const u = isPlainUnit(unit) ? undefined : unit
    const errors: any[] = []

    followers.forEach(ft => {
      const fu = this.registry.get(ft)
      try {
        fu.trigger?.(unit.type, p, u)
      } catch (e) {
        errors.push(e)
      }
    })

    if (errors.length) {
      throw errors
    }
  }

  private leave (unit: DataUnit) {
    expectTrue(this.current === unit)
    this.current = undefined
    this.decType(unit.type)

    if (!this.queue.length) {
      this.stop()
      return
    }

    // !!! NOW OR THEN !!!
  }

  private timer: ReturnType<typeof setTimeout> | undefined

  private stop () {
    expectTrue(this.queue.length === 0)
    expectTrue(this.typeCycles.size === 0)

    if (this.timer) {
      clearTimeout(this.timer)
      this.timer = undefined
    }
  }

  private plan () {
    if (!this.timer) {
      this.timer = setTimeout(() => this.reenter(), 1)
    }
  }

  private reenter () {
  }
}

export const makeMiddleware = <
  S extends StateBase,
  D extends DispatchBase,
> (
  _appContext: AppContext<S, D>,
  registry: UnitsRegistry<S, D>,
): Middleware<any, S, D> => () => (next) => {
  const reduceAsAction = (unit: DataUnit) => {
    const { type } = unit
    const message: any = { type }

    if (isReduceUnit(unit) && unit.slice === true) {
      message.privateUnit = true
    }

    if (isPayloadUnit(unit)) {
      const { payload } = unit
      message.payload = payload
    }

    return next(message)
  }

  const unitsTrigger = new UnitsTrigger(registry)

  return (unit) => {
    if (!isDataUnit(unit)) {
      if (isObject(unit)) {
        const type = get(unit, 'type')

        if (isString(type)) {
          const payload = get(unit, 'payload')
          const result: unknown = next(unit)

          // Trigger plain action dependencies after the reduce is done:
          unitsTrigger.plain(type, payload)

          return result
        } else {
          return next(unit)
        }
      } else {
        return next(unit)
      }
    }

    if (isOnlyUnit(unit) && unit.isOnlyUnit?.() !== false) {
      unitsTrigger.enter(unit)
      return // stop processing
    }

    let result: unknown = undefined

    // Reduce units are processed before the chain actions:
    if (isReduceUnit(unit)) {
      result = reduceAsAction(unit)
    }

    if (!isReduceUnit(unit)) {
      result = reduceAsAction(unit)
    }

    // Trigger dependent units after the reduce is done:
    unitsTrigger.enter(unit)

    return result
  }
}
