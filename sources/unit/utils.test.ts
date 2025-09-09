import { UnknownAction } from 'redux'
import { configureStore, createDynamicMiddleware, Selector } from '@reduxjs/toolkit'
import { deepDiff, noop } from 'sources/lodash'
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
      const diff = deepDiff(stateOld ?? {}, stateNew ?? {})
      actions.push(diff ? { ...action, diff } : action)
    }
  }

  return { logger, actions }
}

export interface ActionStep extends ActionDiff {
  index: number,
}

export type StepsLogger = (action: ActionStep) => void

export const asyncLogger = (timeout: number, stepper: StepsLogger) => {
  let index = 0
  let timer: ReturnType<typeof setTimeout> | undefined

  let resolveSteps: ((index: number) => void) = noop
  let rejectSteps: ((error?: any) => void) = noop

  const stepsPromise = new Promise<number>((resolve, reject) => {
    resolveSteps = () => resolve(index)
    rejectSteps = reject
  })

  const stopTimer = () => {
    if (timer) {
      clearTimeout(timer)
      timer = undefined
    }
  }

  const startTimer = () => {
    if (!timer) {
      timer = setTimeout(() => rejectSteps(`Timeout-@[${index}]`), timeout)
    }
  }

  const logger: ReduceLogger = (
    stateNew: any,
    action: UnknownAction,
    stateOld: any,
  ) => {
    // Skip Redux system actions:
    if (!action.type.startsWith('@@')) {
      const diff = deepDiff(stateOld ?? {}, stateNew ?? {})
      const step: ActionStep = { index, diff, ...action }

      index++
      stopTimer()

      Promise.resolve(step).then(() => {
        try {
          stepper(step)
          startTimer()
        } catch (e: any) {
          rejectSteps(e)
        }
      })
    }
  }

  const finishSteps = () => {
    stopTimer()
    resolveSteps(index)
  }

  const failSteps = (reason: any) => {
    stopTimer()
    rejectSteps(reason)
  }

  const stepsComplete = () => {
    startTimer()
    return stepsPromise
  }

  return { logger, stepsComplete, finishSteps, failSteps }
}

export const makeTestStore = (
  logger?: ReduceLogger,
  onAsyncError?: (error: unknown) => void,
) => {
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
  const uu = unitUtilities(appContext, onAsyncError)
  const registry = makeUnitsRegistry(appContext)
  const registerUnits = registry.register.bind(registry)
  const select = (selector: Selector) => () => selector(store.getState())

  //@ts-expect-error not interested in complex typings for some tests?
  addMiddleware(registry.middleware)
  installReducer(registry.reducer)

  return {
    appContext,
    registry,
    registerUnits,
    dispatch,
    select,
    ...uu,
    uu,
  }
}
