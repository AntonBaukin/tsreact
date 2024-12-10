import { ReactNode } from 'react'

export type ScreenSizeListener = (width: number, height: number) => void

export interface ScreenSize {
  width: number,
  height: number,
  addListener: (listener: ScreenSizeListener) => void,
  removeListener: (listener: ScreenSizeListener) => void,
}

export type ScreenDimensionSize =
  // Narrow layout for phones with portrait orientation:
  | 'phone'
  // Middle layout for phones with album orientation and portrait tablets:
  | 'tablet'
  // Wide layout for album oriented tablets and desktop screens:
  | 'desktop'

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
