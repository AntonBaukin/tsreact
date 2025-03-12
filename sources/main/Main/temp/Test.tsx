import { FC } from 'react'
import { useAppState } from 'sources/main/store'
import { updateUiIndex } from './units'

const Test: FC = () => {
  const index = useAppState(updateUiIndex.selectIndex)

  return (
    <div>
      <span>Test global counter: {index}</span>
      <button onClick={updateUiIndex.onInc}>Increment</button>
      <button onClick={updateUiIndex.onDec}>Decrement</button>
    </div>
  )
}

export default Test
