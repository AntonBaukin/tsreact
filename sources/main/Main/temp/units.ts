import { defineUnit } from 'sources/main/context'
import { UiSlice } from 'sources/main/store/ui/types'

export const incUiIndex = defineUnit({
  name: 'incUiIndex',
  slice: 'ui',
  reduce(uiSlice: UiSlice) {
    uiSlice.testIndex++
  }
})

export const decUiIndex = defineUnit({
  name: 'decUiIndex',
  slice: 'ui',
  reduce(uiSlice: UiSlice) {
    uiSlice.testIndex--
  }
})
