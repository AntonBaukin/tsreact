import { expectNotNil } from 'sources/asserts'
import { defineSliceUnit } from 'sources/main/context'
import { UiSlice } from 'sources/main/store/ui/types'

export type MenuState = Pick<UiSlice, 'isMenuCompact'>

export const menuUnit = defineSliceUnit({
  name: 'ui.Menu',

  slice: 'ui',

  reduceSlice(ui: UiSlice, payload: MenuState | null) {
    const { isMenuCompact } = expectNotNil(payload)
    Object.assign(ui, { isMenuCompact })
  },
})
  .dispatchSelf({
    setCompact(isMenuCompact: boolean) {
      if (this.currentState.isMenuCompact !== isMenuCompact) {
        this.dispatchSelf(({ isMenuCompact }))
      }
    },
  })
  .select({
    selectMenuCompact: (ui: UiSlice) => ui.isMenuCompact,
  })
  .dataUnit
