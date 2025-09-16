import { lazy } from 'react'
import { Routes } from 'sources/co/Routing'
import { defineUnit } from 'sources/main/context'
import { DataUnit } from 'sources/unit'
import {
  RouteChanged,
  appDoChangeRoute,
  appRouteChanged,
} from 'sources/app'

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

export const makeRouteChangeActUnit = (
  {
    routeId,
    actsOn,
    trigger,
    ...definition
  }: { routeId: RouteId | RouteId[] } & Parameters<typeof defineUnit>[0],
) => defineUnit({
  ...definition,

  actsOn: () => [
    appRouteChanged,
    ...(actsOn?.() ?? []),
  ],

  /**
   * Works as a filter for route change actions.
   */
  trigger (
    this: DataUnit,
    type: string,
    payload: unknown,
    unit: DataUnit | undefined,
  ) {
    const doTrigger = () => trigger
      ? trigger.call(this, type, payload, unit)
      : Promise.resolve().then(this.dispatchIt) //<-- make it after route change action

    if (type === appRouteChanged.type) {
      const { id } = payload as RouteChanged

      if (!id) {
        return
      }

      if (Array.isArray(routeId)) {
        if (routeId.includes(id as RouteId)) {
          doTrigger()
        }
      } else if (routeId === id) {
        doTrigger()
      }
    } else {
      doTrigger()
    }
  }
}).dataUnit
