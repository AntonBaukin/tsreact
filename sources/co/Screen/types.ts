import { ReactNode } from 'react'

export type ScreenSizeListener = (width: number, height: number) => void

export interface ScreenSize {
  width: number,
  height: number,
  addListener: (listener: ScreenSizeListener) => void,
  removeListener: (listener: ScreenSizeListener) => void,
}

export type ScreenDimensionSize =
  | 'phone'
  | 'phone-large'
  | 'tablet'
  | 'desktop'
  | 'desktop-wide'
  | 'desktop-huge'

export type ScreenDimensionType = 'phone' | 'tablet' | 'desktop'

export type ScreenOrientationType = 'portrait' | 'landscape'

export type ScreenDimensionListener = (
  size: ScreenDimensionSize,
  orientation: ScreenOrientationType,
) => void

export interface ScreenDimension {
  size: ScreenDimensionSize,
  orientation: ScreenOrientationType,
  addListener: (listener: ScreenDimensionListener) => void,
  removeListener: (listener: ScreenDimensionListener) => void,
}

export interface ScreenProps {
  children?: ReactNode,
  // Resize event debounce (in ms) — for performance:
  debounce?: number, // * = 100
}
