import { UnknownAction } from 'redux'
import { expect } from '@jest/globals'
import { DispatchBase, GetStore, makeAppContext, StateBase } from 'sources/app'
import { expectNever } from 'sources/asserts'
import { isString, get } from 'sources/lodash'
import { DataUnit, isDataUnit, isPayload } from './types'
import { makeUnitsRegistry } from './registry'
import { makeMiddleware } from './middleware'
import { cloneUnitPayload, makePlainUnit, unitUtilities } from './utils'

export type ActionLogger = (unit: DataUnit | string, payload?: unknown) => void

export const collectingLogger = () => {
  const units: DataUnit[] = []

  const log: ActionLogger = (unit: DataUnit | string, payload?: unknown) => {
    if (isDataUnit(unit)) {
      units.push(unit)
    } else {
      const plain = makePlainUnit(unit)

      if (payload) {
        units.push(plain)
      } else if (isPayload(payload)) {
        units.push(cloneUnitPayload(plain, payload))
      } else {
        expectNever()
      }
    }
  }

  return { log, units }
}

export const makeTestRegistry = (log: ActionLogger) => {
  const appState: StateBase = Object.freeze({})

  const dispatch: DispatchBase = <T extends UnknownAction> (
    action: T,
    ...extraArgs: any[]
  ) => {
    expect(extraArgs).toHaveLength(0)

    if (isDataUnit(action)) {
      invokeMiddleware(action)
    } else {
      expect(isDataUnit(action)).toBeTruthy()
    }

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
    if (isDataUnit(unit)) {
      expect(!!registry.lookup(unit.type)).toBeTruthy()
    }

    middleware(unit)
  }

  return {
    appContext,
    registry,
    dispatch,
    defineUnit,
  }
}
