import { ReactNode } from 'react'

/**
 * Component is using React to render components as HTML
 * (in a hidden node) and reports this HTML once.
 * To update, use React key.
 */
export interface RenderProps {
  // Callback, memoization is not required:
  onReady: (root: HTMLDivElement) => void,
  children?: ReactNode,
}
