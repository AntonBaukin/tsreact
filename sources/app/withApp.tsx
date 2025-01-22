import { FC, createContext, useContext } from 'react'
import { StateBase, DispatchBase, AppContext } from './types'

export const appLinker = <
  S extends StateBase,
  D extends DispatchBase,
> (appContext: AppContext<S, D>) => {
  const Context = createContext(appContext)

  const withApp = (Component: FC) => {
    const AppComponent: FC = () => (
      <Context.Provider value={appContext}>
        <Component />
      </Context.Provider>
    )

    AppComponent.displayName = `App_${Component.displayName ?? 'Component'}`

    return AppComponent
  }

  const useAppContext = () => useContext(Context)

  return { withApp, useAppContext }
}
