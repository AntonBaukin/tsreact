import { FC, createElement } from 'react'
import cn from 'classnames'
import { HeaderProps, HeaderSize } from './types'
import styles from './styles.module.scss'

const Header: FC<HeaderProps> = ({ size, className, children }) =>
  createElement(
    `h${size}`,
    {
      className: cn(styles.header, styles[`h${size}`], className),
    },
    children,
  )

export default Header
