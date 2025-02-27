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
  DefineUnit,
  DispatchSelf,
  isDispatchSelf,
  CloneUnit,
  PayloadUnit,
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
  A extends Action = InferDispatchAction<D>,
> (
  appContext: AppContext<S, D>,
) => {
  const defineUnit = <
    P extends Payload = Payload,
    U extends any = unknown,
    K extends keyof S = keyof S,
    E extends object = {},
  > (definition: DefineUnit<S, D, A, P, U, K> & E):
    & DataUnit
    & Omit<typeof definition, keyof DefineUnit<S, D, A, P, U, K>> =>
  {
    const {
      name,
      init,
      isOnlyUnit,
      payload,
    } = definition

    const unit = makeDataUnit(name)
    const fields = new Set(['name']) // to exclude

    if (init) {
      fields.add('init')
      Object.assign(unit, {
        initUnit: symInitUnit,
        init,
      })
    }

    if (isOnlyUnit ) {
      fields.add('isOnlyUnit')
      if (isOnlyUnit === true) {
        Object.assign(unit, { onlyUnit: symOnlyUnit })
      } else if (isFunction(isOnlyUnit)) {
        Object.assign(unit, { onlyUnit: symOnlyUnit, isOnlyUnit })
      }
    }

    if (payload) {
      fields.add('payload')
      Object.assign(unit, {
        payloadUnit: symPayloadUnit,
        get payload() {
          return isFunction(payload) ? payload() : cloneDeep(payload)
        },
      })
    }

    if ('reduceGlobal' in definition) {
      const { reduceGlobal } = definition
      expectTrue(isFunction(reduceGlobal))
      fields.add('reduceGlobal')

      Object.assign (
        unit,
        {
          slice: undefined,
          reduce: reduceGlobal,
          reduceUnit: symReduceUnit,
        },
      )
    } else if ('reduceOwn' in definition) {
      const { initialState, reduceOwn } = definition
      expectTrue(initialState === undefined || isFunction(initialState))
      expectTrue(isFunction(reduceOwn))
      fields.add('initialState')
      fields.add('reduceOwn')

      Object.assign (
        unit,
        {
          slice: true,
          reduce: reduceOwn,
          reduceUnit: symReduceUnit,
        },
      )
    } else if ('reduceSlice' in definition) {
      const { slice, reduceSlice } = definition
      expectTrue(isString(slice))
      expectTrue(isFunction(reduceSlice))
      fields.add('slice')
      fields.add('reduceSlice')

      Object.assign (
        unit,
        {
          slice,
          reduce: reduceSlice,
          reduceUnit: symReduceUnit,
        },
      )
    }

    // Copy or extend all other fields of the definition:
    Object.getOwnPropertyNames(definition).forEach(key => {
      if (!fields.has(key)) {
        (unit as any)[key] = extendProperty(unit, (definition as any)[key])
      }
    })

    return unit as any
  }

  const dispatchSelf = <A extends any[], P extends Payload = Payload> (
    getPayload: (this: DataUnit, ...args: A) => P | Promise<P>,
  ): DispatchSelf<A, P> => {
    const dispatchSelf = (...args: A) => {
      const unit = ( dispatchSelf as any).unit

      if (isDataUnit(unit)) {
        expectTrue(isNil(this) || this === unit)
        const payload = getPayload.call(unit, ...args)

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

    Object.assign(dispatchSelf, { dispatchSelf: symDispatchSelf })
    return dispatchSelf as any
  }

  return { defineUnit, dispatchSelf }
}

const extendProperty = (unit: DataUnit, value: unknown): any => {
  if (isDispatchSelf(value)) {
    value.unit = unit
  }

  return value as any
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
