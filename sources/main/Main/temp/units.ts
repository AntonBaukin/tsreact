import { expectNotNil } from 'sources/asserts'
import { defineGlobalUnit } from 'sources/main/context'
import { AppState } from 'sources/main/store'

type IncDec = {
  delta: number,
}

export const updateUiIndex = defineGlobalUnit({
  name: 'incUiIndex',

  reduceGlobal(slices: AppState, payload: IncDec | null) {
    const { delta } = expectNotNil(payload)
    slices.ui.testIndex += delta
  },
}).dispatchSelf({
  onInc: () => ({ delta: +1 }),
  onDec: () => ({ delta: -1 }),
}).dataUnit

