import { FC, VFC } from 'react'
import { ScreenProps } from './types';
import { ScreenDimensionContext, ScreenSizeContext } from './context'
import { useScreenDimensionImpl, useScreenSizeImpl } from './hooks'

export {
  useScreenSize,
  useScreenDimension,
  useScreenDimensionType,
} from './hooks'

const defaultDebounce = 100

const Screen: FC<ScreenProps> = ({ children, debounce }) => {
  const size = useScreenSizeImpl(debounce ?? defaultDebounce)
  const dimension = useScreenDimensionImpl()

  return (
    <ScreenSizeContext.Provider value={size}>
      <ScreenDimensionContext.Provider value={dimension}>
        {children}
      </ScreenDimensionContext.Provider>
    </ScreenSizeContext.Provider>
  )
}

export const withScreenDebounce = (debounce: number, Component: VFC) => {
  const ScreenComponent: VFC = () => (
    <Screen debounce={debounce}>
      <Component />
    </Screen>
  )

  ScreenComponent.displayName = `Screen_${Component.displayName ?? 'Component'}`

  return ScreenComponent
}

export const withScreen = (Component: VFC) =>
  withScreenDebounce(defaultDebounce, Component)

export default Screen
