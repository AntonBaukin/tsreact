import { lazy } from 'react'
import { appDoChangeRoute } from 'sources/app'
import { Routes } from 'sources/co/Routing'

const items = [
  {
    id: 'list',
    path: '/',
    title: 'pages.list',
    component: lazy(() => import('./List')),
  },
  {
    id: 'about',
    path: '/about',
    title: 'pages.about',
    component: lazy(() => import('./About')),
  },
] as const

export type RouteId = typeof items[number]['id']

export const defaultRouteId: RouteId = 'list'

export const routes = items satisfies Routes<RouteId>

export const doChangeRoute = (id: RouteId) => {
  appDoChangeRoute.dispatchSelf({ id })
}
