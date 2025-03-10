import { Action, Reducer, UnknownAction } from 'redux'
import { expectTrue, expectNever } from 'sources/asserts'
import { isFunction, isString, isNil, get, cloneDeep } from 'sources/lodash'
import {
  AppContext,
  DispatchBase,
  InferDispatchAction,
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
  ExtendDataUnitDispatchers,
  DefineSliceUnit,
  SliceUnitBuilder,
  DefineOwnUnit,
  OwnUnitBuilder,
} from './types'

export const initDataUnit = <U extends object>(name: string, unit: U): U & DataUnit =>
  Object.assign(unit, { dataUnit: symDataUnit, type: name }) as (U & DataUnit)

export const makeDataUnit = (name: string): DataUnit => initDataUnit(name, {})

export const dynamicReducer = <
  S = any,
  A extends Action = UnknownAction,
  PS = S
> (reducer: Reducer<S, A, PS>) => {
  let dynReducer: typeof reducer | undefined

  const installReducer = (dr: typeof reducer) => {
    expectTrue(dynReducer === undefined)
    dynReducer = dr
  }

  const wrappingReducer: typeof reducer = (state, action) => {
    if (!dynReducer) {
      return reducer(state, action)
    }

    const dynState = dynReducer(state, action)

    if (get(action, 'privateUnit') === true) {
      return dynState
    } else {
      return reducer(dynState, action)
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
    const { name, init } = definition

    const unit = makeDataUnit(name)
    fields.push('dataUnit', 'name')

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
    const dispatchSelf = <A extends any[] = any[]> (
      ext: DataUnitDispatchers<U, A, P>,
    ) => {
      for (const k of Object.keys(ext)) {
        const gp = ext[k]
        expectTrue(isFunction(gp))

        const ds = makeDispatchSelf<S, D, U, P, A>(appContext, unit, gp);
        Object.assign(unit, { [k]: ds })
      }

      return builder
    }

    Object.assign(builder, { dispatchSelf })
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

const makeDispatchSelf = <
  S extends StateBase,
  D extends DispatchBase,
  U extends DataUnit,
  P extends Payload,
  A extends any[],
> (
  appContext: AppContext<S, D>,
  unit: U,
  getPayload: (this: U, ...args: A) => P | Promise<P>,
) => {
  const dispatchSelf = (...args: A) => {
    const unit = (dispatchSelf as any).unit

    if (isDataUnit(unit)) {
      expectTrue(isNil(this) || this === unit)
      const payload = getPayload.call(unit as U, ...args)

      if (payload instanceof Promise || isFunction((payload as any).then)) {
        Promise.resolve(payload).then(resolvedPayload => {
          const clone = cloneUnitPayload(unit, resolvedPayload)
          appContext.dispatch(clone)
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

const cloneUnit = (original: DataUnit): CloneUnit =>
  Object.assign(
    {},
    original,
    {
      original,
      cloneUnit: symCloneUnit,
    },
  ) as CloneUnit

const cloneUnitPayload = (
  original: DataUnit,
  payload: Payload,
): CloneUnit & PayloadUnit => {
  const clone = cloneUnit(original)

  Object.assign(clone, {
    payloadUnit: symPayloadUnit,
    get payload() {
      return payload
    },
  })

  return clone as (CloneUnit & PayloadUnit)
}
