import { ReactNode } from 'react'

export type RenderByIndex = (index: number, layoutIndex: number) => ReactNode

export type FetchSpeed = -2 | -1 | 0 | 1 | 2

export type WindowFetcher = (
  // Index of some item visible in the viewport:
  offset: number,
  // Approximated number of elements visible in the viewport.
  // Hint: consider using debounce during the warm-up.
  window: number,
  speed: FetchSpeed,
) => void

export interface EverscrollProps {
  children: RenderByIndex,
  // Total number of elements, if known, or number of loaded elements:
  total: number,
  fetcher?: WindowFetcher,
  className?: string,
  classNameGrid?: string,
  // Class of div node added after the grid when the list is at the end:
  classNameEnd?: string,
  // Increment render index to reflow the elements when the data are changed.
  // It's also required as the component itself doesn't track it's dimensions.
  renderIndex?: number, // = 0
  debounce?: number, // = 100ms
}
