import { Middleware, Reducer } from 'redux'
import { isObject } from 'sources/lodash'
import { expectString, expectTrue, expectNever } from 'sources/asserts'
import { DispatchBase, StateBase, AppContext, InferDispatchAction } from 'sources/app'
import { makeMiddleware, unitsReducer } from './middleware'
import {
  DataUnit,
  isDataUnit,
  UnitsRegister,
  isParentUnit,
  isInitUnit,
} from './types'

export interface UnitsRegistry <
  S extends StateBase,
  D extends DispatchBase,
>
{
  register(...units: UnitsRegister[]): void,

  init(): void,

  readonly middleware: Middleware<any, S, D>,

  readonly reducer: Reducer<S, InferDispatchAction<D>, Partial<S>>,

  readonly appContext: AppContext<S, D>,
}

export const flattenUnits = (...units: UnitsRegister[]): DataUnit[] => {
  const result: DataUnit[] = []

  for (const u of units) {
    if (isDataUnit(u)) {
      result.push(u)
      if (isParentUnit(u)) {
        const { children } = u
        if (children) {
          result.push(...flattenUnits(children))
        }
      }
    } else if (Array.isArray(u)) {
      result.push(...flattenUnits(...u))
    } else if (isObject(u)) {
      result.push(...flattenUnits(...Object.values(u)))
    } else {
      expectNever()
    }
  }

  return result
}

export const makeUnitsRegistry = <
  S extends StateBase,
  D extends DispatchBase,
> (
  appContext: AppContext<S, D>,
): UnitsRegistry<S, D> => {
  const all: DataUnit[] = []
  const registry = new Map<String, DataUnit>()

  const registerOne = (unit: DataUnit) => {
    expectTrue(isDataUnit(unit))
    expectString(unit.type)

    expectTrue(
      !registry.has(unit.type),
      () => `Data Unit ${unit.type} is already registered`,
    )

    registry.set(unit.type, unit)
  }

  const register = (...units: UnitsRegister[]) => {
    all.push(...flattenUnits(...units))
    all.forEach(registerOne)
  }

  const init = () => {
    all.filter(isInitUnit).forEach(iu => iu.init(appContext))
  }

  return {
    register,
    init,
    middleware: makeMiddleware(appContext, registry),
    reducer: unitsReducer(registry),
    appContext,
  }
}
