import { FC } from 'react'
import { nameHoc } from 'sources/co/utils/compose'
import { ScreenDimensionContext, ScreenSizeContext } from './context'
import { useScreenDimensionImpl, useScreenSizeImpl } from './hooks'
import { ScreenProps } from './types';

export { useScreenSize, useScreenDimension } from './hooks'

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

export const withScreenDebounce = (debounce: number) => (Component: FC) =>
  nameHoc (
    'Screen',
    Component,
    () => (
      <Screen debounce={debounce}>
        <Component />
      </Screen>
    )
  )

export const withScreen = withScreenDebounce(defaultDebounce)

export default Screen
