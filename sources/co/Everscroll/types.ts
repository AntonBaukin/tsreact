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
  total?: number,
  fetcher?: WindowFetcher,
  className?: string,
  classNameGrid?: string,
  // Increment render index to reflow the elements when the data are changed.
  // It's also required as the component itself doesn't track it's dimensions.
  renderIndex?: number, // = 0
  debounce?: number, // = 100ms
}
