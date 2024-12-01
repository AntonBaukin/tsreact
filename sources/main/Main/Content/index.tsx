import { FC, ReactNode, Children } from 'react'
import cn from 'classnames'
import { ContentProps, Layouts } from './types'
import styles from './styles.module.scss'

const Content: FC<ContentProps> = ({ layout, children }) => (
  <div className={cn(styles.pagelayout, layoutClassName(layout))}>
    {placeLayout(layout, children)}
  </div>
)

const layoutClassName = (layout: Layouts) => styles[layout.split(' ').join('-')]

const placeLayout = (layout: Layouts, children: ReactNode): ReactNode => {
  const [first, second] = Children.toArray(children)

  switch (layout) {
    case 'content':
      return (
        <div className={styles.content}>{first}</div>
      )

    case 'menu content':
      return (
        <>
          <div className = {styles.menu}>{first}</div>
          <div className = {styles.content}>{second}</div>
        </>
      )

    default:
      return <></>
  }
}

export default Content
