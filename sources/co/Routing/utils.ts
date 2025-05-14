import { Location, RouteObject } from 'react-router'
import { Route, Routes } from './types'

// TODO enhance findRoute() to find not exact paths
export const findRoute = <Id extends string> (
  routes: Routes<Id>,
  location: Location,
) => routes.find(r => r.path === location.pathname)

const makeRouteObject = <Id extends string>(route: Route <Id>): RouteObject => ({
  id: route.id,
  path: route.path,
  Component: route.component,
  children: route.children?.map(makeRouteObject),
})

export const routeObjects = <Id extends string>(routes: Routes<Id>) =>
  routes.map(makeRouteObject)
