import { PayloadAction } from '@reduxjs/toolkit'

export interface UiSlice {
}

export const defUiSlice = (): UiSlice => ({
})

export type SetUiAction = PayloadAction<Partial<UiSlice>>
