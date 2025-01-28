import { Middleware } from 'redux'
import { isObject } from 'sources/lodash'
import { expectString, expectTrue, expectNever } from 'sources/asserts'
import { DispatchBase, StateBase, AppContext } from 'sources/app'
import {
  DataUnit,
  isDataUnit,
  UnitsRegister,
  isParentUnit,
  isInitUnit,
  isOnlyUnit,
  isPayloadUnit,
} from './types'

export interface UnitsRegistry <
  S extends StateBase,
  D extends DispatchBase,
>
{
  register(...units: UnitsRegister[]): void,

  init(): void,

  readonly middleware: Middleware<any, S, D>,

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

  const middleware: Middleware<any, S, D> = () => (next) => (action) => {
    if (!isDataUnit(action)) {
      return next(action)
    }

    if (isOnlyUnit(action) && action.isOnlyUnit?.() !== false) {
      return
    }

    const { type } = action
    if (isPayloadUnit(action)) {
      const { payload } = action
      return next({ type, payload })
    } else {
      return next({ type })
    }
  }

  return {
    register,
    init,
    middleware,
    appContext,
  }
}

export const initUnitsRegistry = <
  S extends StateBase,
  D extends DispatchBase,
> (
  appContext: AppContext<S, D>,
  ...units: UnitsRegister[]
): UnitsRegistry<S, D> => {
  const registry = makeUnitsRegistry(appContext)
  registry.register(units)
  return registry
}
