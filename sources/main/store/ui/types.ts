import { PayloadAction } from '@reduxjs/toolkit'

export interface UiSlice {
  isMenuCompact: boolean,
}

export const defUiSlice = (): UiSlice => ({
  isMenuCompact: false,
})

export type SetUiAction = PayloadAction<Partial<UiSlice>>
