import { FC, ReactNode } from 'react'
import cn from 'classnames'
import { BoxProps, Variant } from './types'
import styles from './styles.module.scss'

const Box: FC<BoxProps> = ({ v = 'b', children, className, shadow, focus }) => (
  <>
    <div className={cn(boxClass(v, !!focus, !!shadow), className)}>
      {box(v, children)}
    </div>
    {withDecor(v) && <div className={decorClass(v)} />}
  </>
)

export default Box

const withDecor = (v: Variant) => v === 'b'

const decorClass = (v: Variant) => {
  switch (v) {
    case 'b':
      return cn(styles.shared, styles.framedecor)
    default:
      return undefined
  }
}

const boxClass = (v: Variant, focus: boolean, shadow: boolean) => {
  switch (v) {
    case 'b':
      return cn(
        styles.shared,
        styles.frame,
        focus && styles.focusable,
        shadow && styles.shadow,
      )
    case 'C':
      return cn(styles.shared, styles.container)
    case 'f':
      return styles.fill
    default:
      return undefined
  }
}

const box = (v: Variant, content: ReactNode) => {
  switch (v) {
    case 'b':
      return <div className={styles.back}>{content}</div>
    case 'C':
      return content
    default:
      return null
  }
}
