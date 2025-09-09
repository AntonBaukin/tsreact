import { configureStore, combineReducers, createDynamicMiddleware } from '@reduxjs/toolkit'
import { IS_DEV } from 'sources/config'
import { GetStore } from 'sources/app'
import { makeWithStore } from 'sources/app/withStore'
import { dynamicReducer } from 'sources/unit/utils'
import { AppState, reducers } from './slices'

const { reducer, installReducer } = dynamicReducer(combineReducers(reducers))

export { installReducer }

const dynMiddleware = createDynamicMiddleware<AppState>()

const store = configureStore({
  reducer,
  devTools: IS_DEV,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().prepend(dynMiddleware.middleware),
})

export type AppDispatch = typeof store.dispatch

export const addMiddleware = dynMiddleware
  .addMiddleware
  .withTypes<{ state: AppState, dispatch: AppDispatch }>()

export const withStore = makeWithStore(store)

export const getStore: GetStore<AppState, AppDispatch> = {
  get state(): AppState {
    return store.getState()
  },

  get dispatch(): AppDispatch {
    return store.dispatch
  },
}
