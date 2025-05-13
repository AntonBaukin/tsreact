import { createSlice } from '@reduxjs/toolkit'
import { defUiSlice, SetUiAction } from './types'

const uiSlice = createSlice({
  name: 'ui',
  initialState: defUiSlice(),
  reducers: {
    setUiState(slice, action: SetUiAction) {
      Object.assign(slice, action.payload)
    },
  },
});

export const {
  setUiState,
} = uiSlice.actions

export const ui = uiSlice.reducer
