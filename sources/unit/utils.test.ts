import { UnknownAction } from 'redux'
import { DispatchBase, GetStore, makeAppContext, StateBase } from 'sources/app'
import { isString, get } from 'sources/lodash'
import { DataUnit, isDataUnit } from './types'
import { makeUnitsRegistry } from './registry'
import { makeMiddleware } from './middleware'
import { unitUtilities } from './utils'

export type ActionLogger = (unit: DataUnit | string, payload?: unknown) => void

export const collectingLogger = () => {
  const units: DataUnit[] = []
  const actions: UnknownAction[] = []

  const log: ActionLogger = (unit: DataUnit | string, payload?: unknown) => {
    if (isDataUnit(unit)) {
      units.push(unit)
    } else {
      actions.push(payload ? { type: unit, payload } : { type: unit })
    }
  }

  return { units, actions, log }
}

export const makeTestRegistry = (log: ActionLogger) => {
  const appState: StateBase = Object.freeze({})

  const dispatch: DispatchBase = <T extends UnknownAction> (
    action: T,
    ...extraArgs: any[]
  ) => {
    expect(extraArgs).toHaveLength(0)
    expect(isDataUnit(action)).toBeTruthy()
    invokeMiddleware(action as any as DataUnit)
    return action
  }

  const getStore: GetStore<StateBase, DispatchBase> = {
    get state() {
      return appState
    },

    get dispatch() {
      return dispatch
    }
  }

  const appContext = makeAppContext(getStore)
  const registry = makeUnitsRegistry(appContext)
  const { defineUnit } = unitUtilities(appContext)
  // @ts-expect-error our middleware does not require the api instance
  const middleware = makeMiddleware(appContext, registry)()(next)

  function next(action: unknown) {
    if (isDataUnit(action)) {
      log(action)
    } else {
      const type = get(action, 'type')

      if (isString(type)) {
        log(type, get(action, 'payload'))
      } else {
        expect(isString(type)).toBeTruthy()
      }
    }
  }

  function invokeMiddleware(unit: DataUnit) {
    log(unit)
    middleware(unit)
  }

  return {
    appContext,
    registry,
    dispatch,
    defineUnit,
  }
}
