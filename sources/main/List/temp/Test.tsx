import { FC } from 'react'
import { useAppSelector } from 'sources/main/store/hooks'
import { updateUiIndex } from './units'

const Test: FC = () => {
  const index = useAppSelector(updateUiIndex.selectIndex)

  return (
    <div>
      <span>Test global counter: {index}</span>
      <button onClick={updateUiIndex.onInc}>Increment</button>
      <button onClick={updateUiIndex.onDec}>Decrement</button>
    </div>
  )
}

export default Test
