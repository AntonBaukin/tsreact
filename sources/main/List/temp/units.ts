import { expectNotNil } from 'sources/asserts'
import { defineOwnUnit } from 'sources/main/context'
import { UiSlice } from 'sources/main/store/ui/types'

type IncDec = {
  delta: number,
}

type State = {
  index: number,
}

export const updateUiIndex = defineOwnUnit({
  name: 'incUiIndex',

  initialState: (): State => ({
    index: 0,
  }),

  reduceOwn(state: State, payload: IncDec | null) {
    const { delta } = expectNotNil(payload)
    state.index += delta
  },
}).dispatchSelf({
  onInc: () => ({ delta: +1 }),
  onDec: () => ({ delta: -1 }),
}).select({
  selectIndex: ({ index }: State) => index,
}).dataUnit
