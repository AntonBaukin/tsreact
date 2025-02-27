import { produce } from 'immer'
import { Action, Middleware } from 'redux'
import { isObject, isString, isEmpty, isNil, get, set } from 'sources/lodash'
import { AppContext, DispatchBase, StateBase } from 'sources/app'
import {
  DataUnit,
  isDataUnit,
  isOnlyUnit,
  isPayloadUnit,
  isReduceUnit,
  Payload,
} from './types'

export const unitsReducer = (registry: Map<String, DataUnit>) =>
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
          sliceState = initialState?.() ?? {}
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

export const makeMiddleware = <
  S extends StateBase,
  D extends DispatchBase,
> (
  _appContext: AppContext<S, D>,
  _registry: Map<String, DataUnit>,
): Middleware<any, S, D> => () => (next) => {

  const reduceAsAction = (unit: DataUnit) => {
    const { type } = unit

    if (isPayloadUnit(unit)) {
      const { payload } = unit
      return next({ type, payload })
    } else {
      return next({ type })
    }
  }

  return (unit) => {
    if (!isDataUnit(unit)) {
      return next(unit)
    }

    if (isOnlyUnit(unit) && unit.isOnlyUnit?.() !== false) {
      // TODO chain data units...

      return // stop processing
    }

    let result: unknown = undefined

    // Reduce units are processed before the chain actions:
    if (isReduceUnit(unit)) {
      result = reduceAsAction(unit)
    }

    // TODO chain data units...

    if (!isReduceUnit(unit)) {
      result = reduceAsAction(unit)
    }

    return result
  }
}
