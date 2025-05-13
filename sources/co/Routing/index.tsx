import { FC, ReactNode, ReactElement, createContext, useContext } from 'react'
import { BrowserRouter, RouteObject, useRoutes } from 'react-router'
import { nameHoc } from 'sources/co/utils/compose'

export type { Route, Routes } from './types'

export { findRoute, routeObjects } from './utils'

const RoutesSwitcherContext = createContext<ReactElement | null>(null);

export const useRoutesSwitcher = () => useContext(RoutesSwitcherContext)

const Routing: FC<{ routes: RouteObject[], children: ReactNode }> = ({
  routes,
  children,
}) => {
  const switcher = useRoutes(routes)

  return (
    <RoutesSwitcherContext.Provider value={switcher}>
      {children}
    </RoutesSwitcherContext.Provider>
  )
}

export const withRouting = (routes: RouteObject[]) => (Component: FC) => nameHoc (
  'Routing',
  Component,
  () => (
    <BrowserRouter>
      <Routing routes={routes}>
        <Component />
      </Routing>
    </BrowserRouter>
  )
)
