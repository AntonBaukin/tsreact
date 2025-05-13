import { FC, createContext, useContext, useEffect } from 'react'
import { nameHoc } from 'sources/co/utils/compose'
import { StateBase, DispatchBase, AppContext } from './types'
import { appInit } from './units'

export const appLinker = <
  S extends StateBase,
  D extends DispatchBase,
> (appContext: AppContext<S, D>) => {
  const Context = createContext(appContext)

  const withApp = (Component: FC) => nameHoc (
    'App',
    Component,
    () => {
      useEffect(() => {
        appContext.dispatch(appInit)
      }, [])

      return (
        <Context.Provider value={appContext}>
          <Component />
        </Context.Provider>
      )
    },
  )

  const useAppContext = () => useContext(Context)

  return { withApp, useAppContext }
}
