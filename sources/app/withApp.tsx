import { FC, createContext, useContext, useEffect } from 'react'
import { StateBase, DispatchBase, AppContext } from './types'
import { appInit } from './units'

export const appLinker = <
  S extends StateBase,
  D extends DispatchBase,
> (appContext: AppContext<S, D>) => {
  const Context = createContext(appContext)

  const withApp = (Component: FC) => {
    const AppComponent: FC = () => {
      useEffect(() => {
        appContext.dispatch(appInit)
      }, [])

      return (
        <Context.Provider value={appContext}>
          <Component />
        </Context.Provider>
      )
    }

    AppComponent.displayName = `App_${Component.displayName ?? 'Component'}`

    return AppComponent
  }

  const useAppContext = () => useContext(Context)

  return { withApp, useAppContext }
}
