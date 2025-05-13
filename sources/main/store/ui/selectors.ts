import { createSelector } from '@reduxjs/toolkit';
import { selectUiSlice } from '../slices'

export const selectUiState = createSelector(
  selectUiSlice,
  (ui) => ui,
)
