import {
  FC,
  ReactNode,
  ReactElement,
  createContext,
  useContext,
  useEffect,
  useMemo,
} from 'react'
import { BrowserRouter, useLocation, useRoutes, useNavigate } from 'react-router'
import { nameHoc } from 'sources/co/utils/compose'
import { useListenDataUnit } from 'sources/co/hooks'
import { appDoChangeRoute, appRouteChanged } from 'sources/app'
import { routeObjects } from './utils'
import { Routes } from './types'

export type { Route, Routes } from './types'

const RoutesSwitcherContext = createContext<ReactElement | null>(null);

export const useRoutesSwitcher = () => useContext(RoutesSwitcherContext)

interface RoutingProps<Id extends string> {
  routes: Routes<Id>,
  children: ReactNode,
}

function Routing <Id extends string> ({ routes, children }: RoutingProps<Id>) {
  const routesObj = useMemo(() => routeObjects(routes), [routes])
  const switcher = useRoutes(routesObj)
  const location = useLocation()
  const navigate = useNavigate()

  useEffect(() => {
    // TODO enhance routing to find not exact paths
    const route = routes.find(r => r.path === location.pathname)

    appRouteChanged.dispatchSelf({
      path: location.pathname,
      id: route?.id,
    })
  }, [location.pathname])

  useListenDataUnit(appDoChangeRoute, (u: typeof appDoChangeRoute) => {
    const { payload: { id } = {} } = u
    const route = routes.find(r => r.id === id)

    if (route) {
      navigate(route.path)
    }
  })

  return (
    <RoutesSwitcherContext.Provider value={switcher}>
      {children}
    </RoutesSwitcherContext.Provider>
  )
}

export const withRouting = <Id extends string> (routes: Routes<Id>) =>
  (Component: FC) => nameHoc (
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
