import { ScreenDimensionSize, ScreenOrientationType } from './types'
import { screenWidths } from 'styles/vars'

export const getScreenWidth = () => Math.floor(window.innerWidth)

export const getScreenHeight = () => Math.floor(window.innerHeight)

export const getScreenSize = (): [number, number] => [
  getScreenWidth(),
  getScreenHeight(),
]

export const getScreenOrientation = (): ScreenOrientationType => {
  try {
    return screen.orientation.type.startsWith('portrait') ? 'portrait' : 'landscape'
  } catch {
    return 'landscape'
  }
}

export const getScreenDimensionSize = (): ScreenDimensionSize => {
  const { phone, desktop } = screenWidths()
  const w = getScreenWidth()

  if (phone && w <= phone) {
    return 'phone'
  } else if (desktop && w <= desktop) {
    return 'tablet'
  } else {
    return 'desktop'
  }
}
