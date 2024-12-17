import { ReactNode } from 'react'

export type Variant =
  | 'b'   // frame box (* = the default)
  | 'C'   // decorated container of frame boxes
  | 'f'   // container space fill

export interface BoxProps {
  v?: Variant,
  children?: ReactNode,
  className?: string,
  // Display shadow around the box when inner control has focus or mouse over:
  shadow?: boolean,
  // Contrast the box and the content when inner control has focus:
  focus?: boolean,
}
