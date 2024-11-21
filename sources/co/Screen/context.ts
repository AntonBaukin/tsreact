import { createContext } from 'react'
import { noop } from 'sources/lodash'
import { ScreenSize, ScreenDimension } from './types'
import {
  getScreenDimensionSize,
  getScreenHeight,
  getScreenOrientation,
  getScreenWidth,
} from './utils'

const defaultScreenSize: ScreenSize = {
  width: getScreenWidth(),
  height: getScreenHeight(),
  addListener: noop,
  removeListener: noop,
}

export const ScreenSizeContext = createContext(defaultScreenSize)

const defaultScreenDimension: ScreenDimension = {
  size: getScreenDimensionSize(),
  orientation: getScreenOrientation(),
  addListener: noop,
  removeListener: noop,
}

export const ScreenDimensionContext = createContext(defaultScreenDimension)
