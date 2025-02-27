import { expectNotNil } from 'sources/asserts'
import { defineUnit, dispatchSelf } from 'sources/main/context'
import { UiSlice } from 'sources/main/store/ui/types'

type IncDec = {
  delta: number,
}

export const updateUiIndex = defineUnit({
  name: 'incUiIndex',

  slice: 'ui',

  reduceSlice(uiSlice: UiSlice, payload: IncDec | null) {
    const { delta } = expectNotNil(payload)
    uiSlice.testIndex += delta
  },

  onInc: dispatchSelf(() => ({ delta: +1 })),

  onDec: dispatchSelf(() => ({ delta: -1 })),
})
