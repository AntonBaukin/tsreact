import { UnknownAction } from 'redux'
import { configureStore, createDynamicMiddleware } from '@reduxjs/toolkit'
import { deepDiff } from 'sources/lodash'
import { GetStore, makeAppContext } from 'sources/app'
import { dynamicReducer, ReduceLogger } from 'sources/unit/utils'
import { makeUnitsRegistry } from './registry'
import { unitUtilities } from './utils'

export interface ActionDiff extends UnknownAction {
  diff?: any,
}

export const collectingLogger = () => {
  const actions: ActionDiff[] = []

  const logger: ReduceLogger = (
    stateNew: any,
    action: UnknownAction,
    stateOld: any,
  ) => {
    // Skip Redux system actions:
    if (!action.type.startsWith('@@')) {
      const diff = deepDiff(stateNew, stateOld)
      actions.push(diff ? { ...action, diff } : action)
    }
  }

  return { logger, actions }
}

export const makeTestStore = (logger?: ReduceLogger) => {
  const { reducer, installReducer } = dynamicReducer((state: any) => state, logger)
  const dynMiddleware = createDynamicMiddleware()
  const addMiddleware = dynMiddleware.addMiddleware

  const store = configureStore({
    reducer,
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware().prepend(dynMiddleware.middleware),
  })

  const getStore: GetStore<any, typeof store.dispatch> = {
    get state() {
      return store.getState()
    },

    get dispatch() {
      return store.dispatch
    },
  }

  const dispatch = store.dispatch
  const appContext = makeAppContext(getStore)
  const uu = unitUtilities(appContext)
  const registry = makeUnitsRegistry(appContext)
  const registerUnits = registry.register.bind(registry)

  //@ts-expect-error not interested in complex typings for some tests?
  addMiddleware(registry.middleware)
  installReducer(registry.reducer)

  return {
    appContext,
    registry,
    registerUnits,
    dispatch,
    ...uu,
  }
}
