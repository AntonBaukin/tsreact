import { Middleware, Reducer } from 'redux'
import { isObject, isString } from 'sources/lodash'
import { expectString, expectTrue, expectNever, expectNotNil } from 'sources/asserts'
import { DispatchBase, StateBase, AppContext, InferDispatchAction } from 'sources/app'
import { makeMiddleware, unitsReducer } from './middleware'
import { cloneUnitPayload } from './utils'
import {
  Payload,
  DataUnit,
  isDataUnit,
  UnitsRegister,
  isParentUnit,
  isInitUnit,
} from './types'

export interface UnitsRegistry<S extends StateBase, D extends DispatchBase>
{
  readonly appContext: AppContext<S, D>,

  register(...units: UnitsRegister[]): void,

  init(): void,

  get(type: string): DataUnit,

  readonly followers: Map<string, Set<string>>,

  readonly middleware: Middleware<any, S, D>,

  readonly reducer: Reducer<S, InferDispatchAction<D>, Partial<S>>,
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
  const registry = new Map<string, DataUnit>()
  const followers = new Map<string, Set<string>>()

  const registerOne = (unit: DataUnit) => {
    expectTrue(isDataUnit(unit))
    expectString(unit.type)

    if (registry.has(unit.type)) {
      expectTrue(
        unit === registry.get(unit.type),
        () => `Else Data Unit ${unit.type} is already registered`,
      )
    } else {
      registry.set(unit.type, unit)
      registerActsOn(unit)

      if (isParentUnit(unit)) {
        const { children } = unit

        if (children) {
          registerMany(children)
        }
      }
    }
  }

  const registerMany = (...units: UnitsRegister[]) => {
    all.push(...flattenUnits(...units))
    all.forEach(registerOne)
  }

  const registerActsOnType = (unit: DataUnit, type: string) => {
    const fs = followers.get(type);

    if (fs) {
      fs.add(unit.type)
    } else {
      followers.set(type, new Set([unit.type]));
    }
  }

  const registerActsOnUnit = (unit: DataUnit, target: DataUnit) => {
    registerOne(target)
    registerActsOnType(unit, target.type)
  }

  function registerActsOn (unit: DataUnit) {
    (unit.actsOn?.() ?? []).forEach((ao) => {
      if (isString(ao)) {
        registerActsOnType(unit, ao)
      } else {
        registerActsOnUnit(unit, ao)
      }
    })
  }

  const dispatch = (u: DataUnit, p?: Payload) => {
    if (p) {
      const up = cloneUnitPayload(u, p)
      appContext.dispatch(up)
    } else {
      appContext.dispatch(u)
    }
  }

  class RegistryClause implements UnitsRegistry<S, D>
  {
    readonly appContext = appContext

    register (...units: UnitsRegister[]) {
      registerMany(...units)
    }

    init() {
      all.forEach(u => Object.assign(u, dispatch))
      all.filter(isInitUnit).forEach(iu => iu.init(appContext))
    }

    get(type: string) {
      return expectNotNil(
        registry.get(type),
        () => `Data Unit [${type}] is not defined`,
      )
    }

    readonly followers = followers

    middleware: Middleware<any, S, D>

    reducer: Reducer<S, InferDispatchAction<D>, Partial<S>>

    constructor() {
      this.middleware = makeMiddleware(appContext, this)
      this.reducer = unitsReducer(registry)
    }
  }

  return new RegistryClause()
}
