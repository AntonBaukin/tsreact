import { Action, Reducer, UnknownAction } from 'redux'
import { expectTrue, expectNever } from 'sources/asserts'
import { isFunction, isString, isNil, get, cloneDeep } from 'sources/lodash'
import {
  AppContext,
  DispatchBase,
  StateBase,
} from 'sources/app'
import {
  symDataUnit,
  symInitUnit,
  symOnlyUnit,
  symPayloadUnit,
  symReduceUnit,
  symCloneUnit,
  symDispatchSelf,
  DataUnit,
  isDataUnit,
  Payload,
  PayloadResult,
  isPayload,
  DefineUnit,
  CloneUnit,
  PayloadUnit,
  UnitBuilder,
  DefineOnlyUnit,
  OnlyUnitBuilder,
  OnlyUnit,
  DefineGlobalUnit,
  GlobalUnitBuilder,
  ReduceUnit,
  DataUnitDispatchers,
  DefineSliceUnit,
  SliceUnitBuilder,
  DefineOwnUnit,
  OwnUnitBuilder,
  DataUnitSelectors,
  symUnitSelector,
  PlainUnit,
  symPlainUnit,
  UnitListenerConnect,
  UnitListener,
} from './types'

export const initDataUnit = <U extends object>(name: string, unit: U): U & DataUnit =>
  Object.assign(unit, { dataUnit: symDataUnit, type: name }) as (U & DataUnit)

export const makeDataUnit = (name: string): DataUnit => initDataUnit(name, {})

export const makePlainUnit = (type: string): PlainUnit =>
  initDataUnit(type, { plainUnit: symPlainUnit })

export type ReduceLogger = (stateNew: any, action: UnknownAction, stateOld: any) => void

export const dynamicReducer = <
  S = any,
  A extends Action = UnknownAction,
  PS = S
> (reducer: Reducer<S, A, PS>, logger?: ReduceLogger) => {
  let dynReducer: typeof reducer | undefined

  const installReducer = (dr: typeof reducer) => {
    expectTrue(dynReducer === undefined)
    dynReducer = dr
  }

  const wrappingReducer: typeof reducer = (state, action) => {
    if (!dynReducer) {
      const stateNew = reducer(state, action)
      logger?.(stateNew, action, state)
      return stateNew
    }

    const dynState = dynReducer(state, action)

    if (get(action, 'privateUnit') === true) {
      logger?.(dynState, action, state)
      return dynState
    } else {
      const stateNew = reducer(dynState, action)
      logger?.(stateNew, action, state)
      return stateNew
    }
  }

  return { installReducer, reducer: wrappingReducer }
}

export const unitUtilities = <
  S extends StateBase,
  D extends DispatchBase = DispatchBase,
> (
  appContext: AppContext<S, D>,
) => {
  const initDataUnit = <E extends object> (
    definition: DefineUnit<S, D>,
    fields: string[]
  ): DataUnit & E => {
    const { name, init, actsOn, trigger } = definition

    const unit = makeDataUnit(name)

    fields.push(
      'dataUnit',
      'name',
      'actsOn',
      'listen',
      'trigger',
      'dispatch',
      'dispatchSelf',
    )

    if (actsOn) {
      expectTrue(isFunction(trigger))
      Object.assign(unit, { actsOn, trigger })
    }

    if (init) {
      fields.push('initUnit', 'init')
      Object.assign(unit, { initUnit: symInitUnit, init })
    }

    return unit as DataUnit & E
  }

  // Copy all other fields of the definition:
  const assignExt = (unit: any, definition: any, fields: string[]) => {
    Object.getOwnPropertyNames(definition).forEach(key => {
      if (!fields.includes(key)) {
        unit[key] = definition[key]
      }
    })
  }

  const defineUnit = <E extends object = {}> (
    definition: DefineUnit<S, D, E>,
  ): UnitBuilder<S, D, DataUnit & E> => {
    const fields: string[] = []
    const unit = initDataUnit<E>(definition, fields)

    assignExt(unit, definition, fields)

    return {
      get dataUnit() {
        return unit
      }
    }
  }

  const defineOnlyUnit = <E extends object = {}> (
    definition: DefineOnlyUnit<S, D, E>,
  ): OnlyUnitBuilder<S, D, OnlyUnit & E> => {
    const fields: string[] = []
    const unit = initDataUnit<OnlyUnit & E>(definition, fields)

    const { isOnlyUnit } = definition
    expectTrue(isOnlyUnit === undefined || isFunction(isOnlyUnit))

    Object.assign(unit, { onlyUnit: symOnlyUnit, isOnlyUnit })
    fields.push('onlyUnit', 'isOnlyUnit')

    assignExt(unit, definition, fields)

    return {
      get dataUnit() {
        return unit
      }
    }
  }

  const initPayloadUnit = <P extends Payload = Payload> (
    unit: any,
    fields: string[],
    payload: (() => P) | P | undefined,
  ) => {
    if (payload) {
      expectTrue(isFunction(payload) || isPayload(payload))
      fields.push('payloadUnit')
    } else {
      return
    }

    Object.assign(unit, {
      payloadUnit: symPayloadUnit,
      get payload() {
        if (isFunction(payload)) {
          const result = payload()
          expectTrue(isPayload(result))
          return result
        } else {
          return cloneDeep(payload)
        }
      },
    })
  }

  const initDispatchSelf = <
    U extends DataUnit,
    P extends Payload,
  > (unit: U, builder: any) => {
    const dispatchSelf = <A extends any[]> (
      ext: DataUnitDispatchers<U, A, P>,
    ) => {
      for (const k of Object.keys(ext)) {
        const g = ext[k]
        expectTrue(isFunction(g))

        const d = makeDispatchSelf<S, D, U, P, A>(appContext, unit, g);
        Object.assign(unit, { [k]: d })
      }

      return builder
    }

    Object.assign(builder, { dispatchSelf })
  }

  const initSelect = <
    X extends any,
    U extends ReduceUnit<any, any, any>,
  > (unit: U, builder: any) => {
    const select = <R extends any>(ext: DataUnitSelectors<X, R, U>) => {
      for (const k of Object.keys(ext)) {
        const l = ext[k]
        expectTrue(isFunction(l))

        const s = makeSelector<S, X, U, R>(appContext, unit, l);
        Object.assign(unit, { [k]: s })
      }

      return builder
    }

    Object.assign(builder, { select })
  }

  const defineGlobalUnit = <
    P extends Payload = Payload,
    E extends object = {},
  > (
    definition: DefineGlobalUnit<S, D, P, E>,
  ): GlobalUnitBuilder<S, D, P, ReduceUnit<S, S, P> & E> => {
    const fields: string[] = []
    const unit = initDataUnit<ReduceUnit<S, S, P> & E>(definition, fields)

    const { reduceGlobal: reduce, payload } = definition
    Object.assign(unit, { reduceUnit: symReduceUnit, reduce })
    initPayloadUnit(unit, fields, payload)

    fields.push (
      'reduceUnit', // also include general fields...
      'slice',
      'initialState',
      'reduce',
      'reduceGlobal',
      'payload',
    )

    const builder = {
      get dataUnit() {
        return unit
      }
    }

    assignExt(unit, definition, fields)
    initDispatchSelf<typeof unit, P>(unit, builder)
    initSelect<S, typeof unit>(unit, builder)

    return builder as GlobalUnitBuilder<S, D, P, ReduceUnit<S, S, P> & E>
  }

  const defineSliceUnit = <
    K extends keyof S,
    P extends Payload = Payload,
    E extends object = {},
  > (
    definition: DefineSliceUnit<S, K, D, P, E>,
  ): SliceUnitBuilder<S, K, D, P, ReduceUnit<S, S[K], P> & E> => {
    const fields: string[] = []
    const unit = initDataUnit<ReduceUnit<S, S[K], P> & E>(definition, fields)

    const { reduceSlice: reduce, slice, payload } = definition
    Object.assign(unit, { reduceUnit: symReduceUnit, slice, reduce })
    initPayloadUnit(unit, fields, payload)

    fields.push (
      'reduceUnit',
      'slice',
      'initialState',
      'reduce',
      'reduceSlice',
      'payload',
    )

    const builder = {
      get dataUnit() {
        return unit
      }
    }

    assignExt(unit, definition, fields)
    initDispatchSelf<typeof unit, P>(unit, builder)
    initSelect<S, typeof unit>(unit, builder)

    return builder as SliceUnitBuilder<S, K, D, P, ReduceUnit<S, S[K], P> & E>
  }

  const defineOwnUnit = <
    X extends Payload,
    P extends Payload = Payload,
    E extends object = {},
  > (
    definition: DefineOwnUnit<S, X, D, P, E>,
  ): OwnUnitBuilder<S, X, D, P, ReduceUnit<S, X, P> & E> => {
    const fields: string[] = []
    const unit = initDataUnit<ReduceUnit<S, X, P> & E>(definition, fields)

    const { reduceOwn: reduce, initialState, payload } = definition
    Object.assign(unit, { reduceUnit: symReduceUnit, slice: true, initialState, reduce })
    initPayloadUnit(unit, fields, payload)

    fields.push (
      'reduceUnit',
      'slice',
      'initialState',
      'reduce',
      'reduceOwn',
      'payload',
    )

    const builder = {
      get dataUnit() {
        return unit
      }
    }

    assignExt(unit, definition, fields)
    initDispatchSelf<typeof unit, P>(unit, builder)
    initSelect<S, typeof unit>(unit, builder)

    return builder as OwnUnitBuilder<S, X, D, P, ReduceUnit<S, X, P> & E>
  }

  return {
    defineUnit,
    defineOnlyUnit,
    defineGlobalUnit,
    defineSliceUnit,
    defineOwnUnit,
  }
}

export type UnitUtilities <
  S extends StateBase,
  D extends DispatchBase = DispatchBase,
> = ReturnType<typeof unitUtilities<S, D>>

export type DefineUnitUtility <
  S extends StateBase,
  D extends DispatchBase = DispatchBase,
> = UnitUtilities<S, D>['defineUnit']

export type DefineOnlyUnitUtility <
  S extends StateBase,
  D extends DispatchBase = DispatchBase,
> = UnitUtilities<S, D>['defineOnlyUnit']

export type DefineGlobalUnitUtility <
  S extends StateBase,
  D extends DispatchBase = DispatchBase,
> = UnitUtilities<S, D>['defineGlobalUnit']

export type DefineSliceUnitUtility <
  S extends StateBase,
  D extends DispatchBase = DispatchBase,
> = UnitUtilities<S, D>['defineSliceUnit']

export type DefineOwnUnitUtility <
  S extends StateBase,
  D extends DispatchBase = DispatchBase,
> = UnitUtilities<S, D>['defineOwnUnit']

const makeDispatchSelf = <
  S extends StateBase,
  D extends DispatchBase,
  U extends DataUnit,
  P extends Payload,
  A extends any[],
> (
  appContext: AppContext<S, D>,
  unit: U,
  getPayload: (this: U, ...args: A) => PayloadResult<P>,
) => {
  const dispatchSelf = (...args: A) => {
    const unit = (dispatchSelf as any).unit

    if (isDataUnit(unit)) {
      expectTrue(isNil(this) || this === unit)
      const payload = getPayload.call(unit as U, ...args)

      if (isNil(payload) || payload === undefined) {
        return
      } else if (payload instanceof Promise || isFunction((payload as any).then)) {
        Promise.resolve(payload).then(resolvedPayload => {
          if (!isNil(resolvedPayload) && resolvedPayload !== undefined) {
            const clone = cloneUnitPayload(unit, resolvedPayload)
            appContext.dispatch(clone)
          }
        })
      } else {
        const clone = cloneUnitPayload(unit, payload)
        appContext.dispatch(clone)
      }
    } else {
      expectNever()
    }
  }

  Object.assign(dispatchSelf, { dispatchSelf: symDispatchSelf, unit })
  return dispatchSelf
}

const makeSelector = <
  S extends StateBase,
  X extends any,
  U extends ReduceUnit,
  R extends any,
> (
  _appContext: AppContext<S>,
  unit: U,
  localSelector: (this: U, state: X) => R,
) => {
  const selector = (global: S): R => {
    if (unit.slice === undefined) {
      return localSelector.call(unit, global as any as X)
    } else if (unit.slice === true) {
      let sliceState: any = get(global, unit.type)

      if (isNil(sliceState)) {
        const { initialState } = unit

        if (isNil(initialState)) {
          expectNever()
        } else if (isFunction(initialState)) {
          sliceState = initialState()
        } else {
          sliceState = initialState
        }

        expectTrue(!isNil(sliceState))
      }

      return localSelector.call(unit, sliceState as X)
    } else {
      const { slice } = unit

      if (!isString(slice) || !slice.length) {
        expectNever()
      }

      const sliceState: any = get(global, slice)
      expectTrue(!isNil(sliceState))

      return localSelector.call(unit, sliceState as X)
    }
  }

  Object.assign(selector, { unitSelector: symUnitSelector, unit })
  return selector
}

export const cloneUnit = <U extends DataUnit = DataUnit> (
  original: DataUnit,
): U & CloneUnit =>
  Object.assign(
    {},
    original,
    {
      original,
      cloneUnit: symCloneUnit,
    },
  ) as (U & CloneUnit)

export const makePayloadUnit = <P extends Payload = Payload> (
  name: string,
  defaultPayload?: P,
): PayloadUnit<P> => {
  const unit = makeDataUnit(name)

  Object.assign(unit, {
    payloadUnit: symPayloadUnit,
    get payload() {
      return defaultPayload
    },
  })

  return unit as PayloadUnit<P>
}

export const cloneUnitPayload = <
  U extends DataUnit = DataUnit,
  P extends Payload = Payload,
> (
  original: U,
  payload: P,
): U & CloneUnit & PayloadUnit<P> => {
  expectTrue(isPayload(payload))
  const clone = cloneUnit(original)

  Object.assign(clone, {
    payloadUnit: symPayloadUnit,
    get payload() {
      return payload
    },
  })

  return clone as (U & CloneUnit & PayloadUnit<P>)
}

const symListenerConnect = Symbol.for('DataUnit.ListenerConnect')

export interface UnitListeners extends UnitListenerConnect
{
  /**
   * Registers the listener and returns unsubscribe function.
   */
  (listener: UnitListener): (() => void),

  symListenerConnect: typeof symListenerConnect,

  /**
   * Invokes the listener on the Data Unit of the same type:
   * the exact instance may differ for cloned payload units.
   */
  invoke(unit: DataUnit): void,
}

export const asDataUnitListeners = (unit: DataUnit): UnitListeners | undefined => {
  const l = unit.listen

  if ('symListenerConnect' in l && l.symListenerConnect === symListenerConnect) {
    return l as UnitListeners
  }
}

export const makeUnitListeners = (unit: DataUnit): UnitListeners => {
  const listeners: UnitListener[] = []

  function Listener (listener: UnitListener) {
    expectTrue (
      !listeners.includes(listener),
      () => `Attempt to register the same listener for Data Unit [${unit.type}]`,
    )

    listeners.push(listener)

    return () => {
      const index = listeners.indexOf(listener)

      if (index >= 0) {
        listeners.splice(index, 1)
      }
    }
  }

  const invoke = (u: DataUnit) => {
    listeners.forEach(l => l(u))
  }

  return Object.assign(Listener, { symListenerConnect, invoke }) as UnitListeners
}
