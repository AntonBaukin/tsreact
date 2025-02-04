import { FC, useCallback } from 'react'
import { useAppState, useAppDispatch, selectTestIndex } from 'sources/main/store'
import { incUiIndex, decUiIndex } from './units'

const Test: FC = () => {
  const dispatch = useAppDispatch()
  const index = useAppState(selectTestIndex)

  const onInc = useCallback(() => dispatch(incUiIndex), [])
  const onDec = useCallback(() => dispatch(decUiIndex), [])

  return (
    <div>
      <span>Test global counter: {index}</span>
      <button onClick={onInc}>Increment</button>
      <button onClick={onDec}>Decrement</button>
    </div>
  )
}

export default Test
