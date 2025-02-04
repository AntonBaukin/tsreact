import { useDispatch, useSelector } from 'react-redux'
import { AppDispatch } from './create'
import { AppState } from './slices'

export type { AppState, AppDispatch }
export { withStore } from './create'
export * from './selectors'

export const useAppDispatch = useDispatch.withTypes<AppDispatch>()
export const useAppState = useSelector.withTypes<AppState>()
