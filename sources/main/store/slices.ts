import { StateFromReducersMapObject } from '@reduxjs/toolkit'
import { ui } from './ui/slice'

export const reducers = {
  ui,
}

export type AppState = StateFromReducersMapObject<typeof reducers>

export const selectUiSlice = ({ ui }: AppState) => ui
