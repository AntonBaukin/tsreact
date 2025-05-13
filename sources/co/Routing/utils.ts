import { RouteObject } from 'react-router'
import { expectNotNil } from 'sources/asserts'
import { Route, Routes } from './types'

export const findRoute = <Id extends string>(routes: Routes<Id>, id: string) =>
  expectNotNil(routes.find(r => r.id === id), () => `Route ${id} is not found`)

const makeRouteObject = <Id extends string>(route: Route <Id>): RouteObject => ({
  id: route.id,
  path: route.path,
  Component: route.component,
  children: route.children?.map(makeRouteObject),
})

export const routeObjects = <Id extends string>(routes: Routes<Id>) =>
  routes.map(makeRouteObject)
