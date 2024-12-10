import { ReactNode } from 'react'

export type Variant =
  | 'b'   // frame box (* = the default)
  | 'C'   // decorated container of frame boxes
  | 'f'   // container space fill

export interface BoxProps {
  v?: Variant,
  children?: ReactNode,
  className?: string,
}
