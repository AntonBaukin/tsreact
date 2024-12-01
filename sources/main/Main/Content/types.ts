import { ReactNode } from 'react'

// Supported combinations of the layouts:
export type Layouts = 'content' | 'menu content'

export interface ContentProps {
  layout: Layouts;
  children?: ReactNode;
}
