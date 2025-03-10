import { Action, Reducer, UnknownAction } from 'redux'
import { expectTrue, expectNever } from 'sources/asserts'
import { isFunction, isString, isNil, cloneDeep } from 'sources/lodash'
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

  const wrappingReducer: typeof reducer = (state, action) =>
    dynReducer ? reducer(dynReducer(state, action), action) : reducer(state, action)

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
      'reduceUnit',
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



  //
 //   } else if ('reduceOwn' in definition) {
  //     const { initialState, reduceOwn } = definition
  //     expectTrue(initialState === undefined || isFunction(initialState))
  //     expectTrue(isFunction(reduceOwn))
  //     fields.add('initialState')
  //     fields.add('reduceOwn')
  //
  //     Object.assign (
  //       unit,
  //       {
  //         slice: true,
  //         reduce: reduceOwn,
  //         reduceUnit: symReduceUnit,
  //       },
  //     )
  //   } else if ('reduceSlice' in definition) {
  //     const { slice, reduceSlice } = definition
  //     expectTrue(isString(slice))
  //     expectTrue(isFunction(reduceSlice))
  //     fields.add('slice')
  //     fields.add('reduceSlice')
  //
  //     Object.assign (
  //       unit,
  //       {
  //         slice,
  //         reduce: reduceSlice,
  //         reduceUnit: symReduceUnit,
  //       },
  //     )
  //   }
  //
  //   // Copy or extend all other fields of the definition:
  //   Object.getOwnPropertyNames(definition).forEach(key => {
  //     if (!fields.has(key)) {
  //       (unit as any)[key] = extendProperty(unit, (definition as any)[key])
  //     }
  //   })
  //
  //   return unit as any
  // }
  //

  return { defineUnit, defineOnlyUnit, defineGlobalUnit }
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
