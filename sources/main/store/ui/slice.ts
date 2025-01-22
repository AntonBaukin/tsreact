import { createSlice } from '@reduxjs/toolkit'
import { findRoute } from 'sources/co/utils/routing'
import getRoutes from 'sources/main/routes'

import {
  defUiSlice,
  SetUiRouteAction,
} from './types'

const uiSlice = createSlice({
  name: 'ui',
  initialState: defUiSlice(),
  reducers: {
    setUiRouteId(slice, action: SetUiRouteAction) {
      const route = findRoute(getRoutes, action.payload)
      slice.routeId = route.id
    },
  },
});

export const {
  setUiRouteId,
} = uiSlice.actions

export const ui = uiSlice.reducer
