import { ReactNode } from 'react'

export type HeaderSize = '1' | '2' | '3' | '4' | '5' | '6'

export interface HeaderProps {
  size: HeaderSize,
  className?: string,
  children?: ReactNode,
}
