import { ScreenDimensionSize, ScreenDimensionType, ScreenOrientationType } from './types'
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
  const {
    phone,
    tablet,
    desktop,
    wide,
    huge,
  } = screenWidths()

  const w = getScreenWidth()

  if (phone && w < phone) {
    return 'phone'
  } else if (tablet && w < tablet) {
    return 'phone-large'
  } else if (desktop && w < desktop) {
    return 'tablet'
  } else if (wide && w < wide) {
    return 'desktop'
  } else if (huge && w < huge) {
    return 'desktop-wide'
  } else if (phone && tablet && desktop && wide && huge) {
    return 'desktop-huge'
  } else {
    return 'desktop'
  }
}

export const getScreenDimensionType = (size: ScreenDimensionSize): ScreenDimensionType => {
  switch (size) {
    case 'phone':
    case 'phone-large': {
      return 'phone'
    }

    case 'tablet': {
      return 'tablet'
    }

    default: {
      return 'desktop'
    }
  }
}
