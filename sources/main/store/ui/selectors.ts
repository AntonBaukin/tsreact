import { createSelector } from '@reduxjs/toolkit';
import { selectUiSlice } from '../slices'

export const selectUiRouteId = createSelector(
  selectUiSlice,
  ({ routeId }) => routeId,
)
