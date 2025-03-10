import { expectNotNil } from 'sources/asserts'
import { defineSliceUnit } from 'sources/main/context'
import { UiSlice } from 'sources/main/store/ui/types'

type IncDec = {
  delta: number,
}

export const updateUiIndex = defineSliceUnit({
  name: 'incUiIndex',

  slice: 'ui',

  reduceSlice(ui: UiSlice, payload: IncDec | null) {
    const { delta } = expectNotNil(payload)
    ui.testIndex += delta
  },
}).dispatchSelf({
  onInc: () => ({ delta: +1 }),
  onDec: () => ({ delta: -1 }),
}).dataUnit

