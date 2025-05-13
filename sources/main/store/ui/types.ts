import { PayloadAction } from '@reduxjs/toolkit'
import { RouteId, defaultRouteId } from 'sources/main/routes'

export interface UiSlice {
  routeId: RouteId,
}

export const defUiSlice = (): UiSlice => ({
  routeId: defaultRouteId,
})

export type SetUiRouteAction = PayloadAction<RouteId>
