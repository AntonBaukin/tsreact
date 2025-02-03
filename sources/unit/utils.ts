import { Action, Reducer, UnknownAction } from 'redux'
import { expectTrue, expectNever } from 'sources/asserts'
import { isFunction, isString, cloneDeep } from 'sources/lodash'
import {
  DispatchBase,
  InferDispatchAction,
  StateBase,
} from 'sources/app'
import {
  DataUnit,
  symDataUnit,
  symInitUnit,
  symOnlyUnit,
  symPayloadUnit,
  symReduceUnit,
  Payload,
  DefineUnit,
} from './types'

export const initDataUnit = <U extends object>(name: string, unit: U): U & DataUnit =>
  Object.assign(unit, { dataUnit: symDataUnit, type: name }) as (U & DataUnit)

export const makeDataUnit = (name: string): DataUnit => initDataUnit(name, {})

// export const initParentUnit = <U extends DataUnit> (
//   unit: U,
//   children: UnitsRegister,
// ): U & ParentUnit =>
//   Object.assign(unit, {
//     parentUnit: symParentUnit,
//     get children(): UnitsRegister {
//       return children
//     },
//   }) as (U & ParentUnit)

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

export const unitMakers = <
  S extends StateBase,
  D extends DispatchBase = DispatchBase,
  A extends Action = InferDispatchAction<D>,
> () => {
  const defineUnit = <
    P extends Payload = Payload,
    U extends any = unknown,
    K extends keyof S = keyof S,
  > (definition: DefineUnit<S, D, A, P, U, K>): DataUnit => {
    const {
      name,
      init,
      isOnlyUnit,
      payload,
      slice,
      reduce,
    } = definition

    const unit = makeDataUnit(name)

    if (init) {
      Object.assign(unit, {
        initUnit: symInitUnit,
        init,
      })
    }

    if (isOnlyUnit === true) {
      Object.assign(unit, { onlyUnit: symOnlyUnit })
    } else if (isFunction(isOnlyUnit)) {
      Object.assign(unit, { onlyUnit: symOnlyUnit, isOnlyUnit })
    }

    if (payload) {
      Object.assign(unit, {
        payloadUnit: symPayloadUnit,
        get payload() {
          return isFunction(payload) ? payload() : cloneDeep(payload)
        },
      })
    }

    if (isFunction(reduce)) {
      if (slice === undefined) {
        Object.assign(unit, { reduceUnit: symReduceUnit, reduce })
      } else if (slice) {
        expectTrue(slice === true || isString(slice))
        Object.assign(unit, { reduceUnit: symReduceUnit, slice, reduce })
      } else {
        expectNever()
      }
    }

    return unit
  }

  return { defineUnit }
}
