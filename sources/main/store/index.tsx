import { FC } from 'react'
import { Provider } from 'react-redux'
import { configureStore, combineReducers } from '@reduxjs/toolkit'
import { IS_DEV } from 'sources/config'
import { GetStore } from 'sources/app'
import { AppState, reducers } from './slices'

export * from './selectors'

const reducer = combineReducers(reducers)

const store = configureStore({ reducer, devTools: IS_DEV })

export type AppDispatch = typeof store.dispatch

export const getStore: GetStore<AppState, AppDispatch> = {
  get state(): AppState {
    return store.getState()
  },

  get dispatch(): AppDispatch {
    return store.dispatch
  },
}

export const withStore = (Component: FC) => () => (
  <Provider store={store}>
    <Component />
  </Provider>
)
