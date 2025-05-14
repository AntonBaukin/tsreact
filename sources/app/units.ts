import { makeDataUnit, makePayloadUnit } from 'sources/unit'

/**
 * Triggered once when the application is fully loaded.
 */
export const appInit = makeDataUnit('app.Init')

export type RouteChanged = {
  path: string,
  // Key of a known route, if may be defined:
  id?: string,
}

export const appRouteChanged = makePayloadUnit<RouteChanged>('app.RouteChanged')

// TODO add query parameters to DoChangeRoute
export type DoChangeRoute = {
  id: string,
}

export const appDoChangeRoute = makePayloadUnit<DoChangeRoute>('app.DoChangeRoute')
