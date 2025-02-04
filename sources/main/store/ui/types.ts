import { PayloadAction } from '@reduxjs/toolkit'
import getRoutes, { RouteKey } from 'sources/main/routes'
import { findDefaultRoute } from 'sources/co/utils/routing'

export interface UiSlice {
  routeId: RouteKey,
  testIndex: number,
}

export const defUiSlice = (): UiSlice => ({
  routeId: findDefaultRoute(getRoutes).id,
  testIndex: 1,
})

export type SetUiRouteAction = PayloadAction<RouteKey>
