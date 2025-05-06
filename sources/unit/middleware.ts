import { produce } from 'immer'
import { Action, Middleware } from 'redux'
import { AppContext, DispatchBase, StateBase } from 'sources/app'
import { expectTrue, warn } from 'sources/asserts'
import {
  isFunction,
  isObject,
  isString,
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
  ReduceUnit,
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

export type UnitsQueueAnalyser = (queue: DataUnit[]) => {
  // What timout (ms) to set when delaying the queue execution:
  timeout?: number,
}

export class UnitsTrigger<S extends StateBase, D extends DispatchBase>
{
  constructor (registry: UnitsRegistry<S, D>, analyzer?: UnitsQueueAnalyser) {
    this.registry = registry
    this.analyzer = analyzer
    this.reenter = this.reenter.bind(this)
  }

  private readonly registry: UnitsRegistry<S, D>

  private readonly analyzer: UnitsQueueAnalyser | undefined

  private current: DataUnit | string | undefined

  private queue: DataUnit[] = []

  private typeCycles = new Map<string, number>()

  private plainUnits = new PlainUnits()

  plain (type: string, p?: any) {
    let unit = this.registry.lookup(type)

    if (unit) {
      if (p) {
        if (!isPayloadUnit(unit) || !isEqual(p, unit.payload)) {
          unit = cloneUnitPayload(unit, p)
        }
      }
    } else {
      unit = this.plainUnits.get(type, p)
    }

    this.enter(unit)
  }

  enter (unit: DataUnit) {
    if (this.current) {
      this.enqueue(unit)
    } else {
      this.cycle(unit)
    }
  }

  private enqueue(unit: DataUnit) {
    // Note: we accumulate the unit types counters and do not
    // decrement them intentionally to prevent infinite loops
    this.incType(unit.type)

    if (this.current === unit) {
      if (this.numType(unit.type) > 2) {
        warn(`Recursive dispatching the same Data Unit ${unit.type} more than twice`)
      } else {
        this.queue.push(unit)
      }
    } else {
      this.queue.push(unit)
    }
  }

  private cycle(unit: DataUnit) {
    let next: DataUnit | undefined = unit

    // cycle in a synchronous loop:
    while (next) {
      if (this.handle(next)) {
        next = this.queue.shift()
      } else {
        next = undefined
      }
    }
  }

  private handle (unit: DataUnit) {
    const queueLength = this.queue.length

    try {
      expectTrue(this.current === undefined)
      this.current = unit
      this.trigger(unit)
      return this.leave(unit)
    } catch (e: unknown) {
      this.current = undefined
      this.recover(queueLength, e)
    }
  }

  private numType (type: string) {
    return this.typeCycles.get(type) ?? 0
  }

  private incType (type: string) {
    this.typeCycles.set(type, 1 + this.numType(type))
  }

  private resetCounters () {
    this.typeCycles.clear()
  }

  private recover (queueLength: number, error: unknown) {
    if (queueLength < this.queue.length) {
      this.recoverPrune(this.queue.splice(queueLength))
    }

    if (this.queue.length) {
      this.plan()
    } else {
      this.stop()
    }

    throw error
  }

  private recoverPrune(removed: DataUnit[]) {
    warn('Removed Data Units on error recover: ' + removed.map(u => u.type).join(', '))
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

    if (errors.length === 1) {
      throw errors[0]
    } else if (errors.length) {
      throw errors
    }
  }

  private leave (unit: DataUnit) {
    expectTrue(this.current === unit)
    this.current = undefined

    if (!this.queue.length) {
      this.stop()
    } else if (this.isQueueDelayed) {
      this.plan()
    } else {
      return true
    }
  }

  private get isQueueDelayed () {
    return this.numType(this.queue[0].type) > 1
  }

  private timer: ReturnType<typeof setTimeout> | undefined

  private stop () {
    expectTrue(this.queue.length === 0)
    this.stopTimer()
    this.resetCounters()
  }

  private stopTimer() {
    if (this.timer) {
      clearTimeout(this.timer)
      this.timer = undefined
    }
  }

  private get timeout () {
    if (this.queue.length) {
      const t = this.analyzer?.(this.queue)

      if (isNil(t?.timeout)) {
        return 1
      } else {
        expectTrue(t.timeout >= 1)
        return t.timeout
      }
    } else {
      return 1
    }
  }

  private plan () {
    if (!this.timer) {
      const t = this.timeout

      if (t) {
        this.timer = setTimeout(this.reenter, t)
      }
    }
  }

  private reenter () {
    if (this.current) {
      return
    }

    const next = this.queue.shift()

    if (next) {
      this.stopTimer()
      this.cycle(next)
    } else {
      this.stop()
    }
  }
}

export const makeMiddleware = <
  S extends StateBase,
  D extends DispatchBase,
> (
  _appContext: AppContext<S, D>,
  registry: UnitsRegistry<S, D>,
  analyzer?: UnitsQueueAnalyser,
): Middleware<any, S, D> => () => (next) => {
  const reduceAsAction = (unit: ReduceUnit) => {
    const { type } = unit
    const message: any = { type }

    if (unit.slice === true) {
      message.privateUnit = true
    }

    if (isPayloadUnit(unit)) {
      const { payload } = unit
      message.payload = payload
    }

    return next(message)
  }

  const unitsTrigger = new UnitsTrigger(registry, analyzer)

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

    // Reduce units are processed before the chain actions:
    if (isReduceUnit(unit)) {
      let result: unknown = reduceAsAction(unit)

      // Trigger dependent units after the reduce is done:
      unitsTrigger.enter(unit)

      return result
    } else {
      // Trigger dependent units before the further middleware chain:
      unitsTrigger.enter(unit)

      return next(unit)
    }
  }
}
