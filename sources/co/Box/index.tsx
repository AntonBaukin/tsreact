import { FC, ReactNode } from 'react'
import cn from 'classnames'
import { BoxProps, Variant } from './types'
import styles from './styles.module.scss'

const Box: FC<BoxProps> = ({ v, children, className }) => (
  <div className={cn(cls(v), className)}>
    {box(v, children)}
  </div>
)

const cls = (v: Variant) => {
  switch (v) {
    case 'f':
      return styles.frame
    case 'L':
      return styles.frameline
    case 'fl':
    case 'fr':
      return styles.framedecor
    case 'ff':
      return styles.framefill
    default:
      return null
  }
}

const box = (v: Variant, c: ReactNode) => {
  switch (v) {
    case 'f':
      return frame(c)
    case 'ff':
      return frame(null)
    case 'L':
      return c
    case 'fl':
      return sDecorLeft
    case 'fr':
      return sDecorRight
    default:
      return null
  }
}

export default Box

const frame = (c: ReactNode) => (
  <>
    {c}
    {sTopLine}
    {sRightSlant}
    {sBottomLine}
    {sLeftSlant}
  </>
)

const svg = (className: string, content: ReactNode) => (
  <svg
    viewBox="0 0 8 8"
    className={cn(styles.sprite, className)}
    preserveAspectRatio="none"
  >
    {content}
  </svg>
)

const sTopLine = svg(
  styles.tl,
  <path strokeWidth="2px" d="M 0 0 h 8"/>,
)

const sBottomLine = svg(
  styles.bl,
  <path strokeWidth="2px" d="M 0 8 h 8"/>,
)

const sRightSlant = svg(
  styles.rs,
  <path strokeWidth="2px" d="M 4 0 h 4 l -4 8 h -4"/>,
)

const sLeftSlant = svg(
  styles.ls,
  <path strokeWidth="2px" d="M 4 0 h 4 l -4 8 h -4"/>,
)

const sDecorLeft = svg(
  styles.dl,
  <path strokeWidth="2px" d="M 0 0 h 8 l -4 8 h -4"/>,
)

const sDecorRight = svg(
  styles.dr,
  <path strokeWidth="2px" d="M 4 0 h 4 v 8 h -8"/>,
)
