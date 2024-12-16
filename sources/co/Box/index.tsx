import { FC, ReactNode } from 'react'
import cn from 'classnames'
import { BoxProps, Variant } from './types'
import styles from './styles.module.scss'

const Box: FC<BoxProps> = ({ v = 'b', children, className }) => (
  <div className={cn(cls(v), className)}>
    {box(v, children)}
  </div>
)

export default Box

const cls = (v: Variant) => {
  switch (v) {
    case 'b':
      return styles.frame
    case 'C':
      return styles.container
    case 'f':
      return styles.fill
    default:
      return null
  }
}

const box = (v: Variant, content: ReactNode) => {
  switch (v) {
    case 'b':
      return frame(content)
    case 'f':
      return frame(<div/>)
    case 'C':
      return container(content)
    default:
      return null
  }
}

const frame = (content: ReactNode) => (
  <>
    <div className={styles.back}>
      {content}
    </div>
    {sTopLine}
    {sRightSlant}
    {sBottomLine}
    {sLeftSlant}
  </>
)

const decor = (content: ReactNode) => (
  <div className={styles.decor}>
    {content}
  </div>
)

const container = (content: ReactNode) => (
  <>
    {decor(sDecorBegin)}
    {content}
    {decor(sDecorEnd)}
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

const sDecorBegin = svg(
  styles.begin,
  <path strokeWidth="2px" d="M 0 0 h 8 l -4 8 h -4"/>,
)

const sDecorEnd = svg(
  styles.end,
  <path strokeWidth="2px" d="M 4 0 h 4 v 8 h -8"/>,
)
