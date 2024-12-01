import { VFC } from 'react'
import Gradient from './gradient'
import styles from './styles.module.scss'

const Background: VFC = () => {
  return (
    <svg
      className={styles.background}
      preserveAspectRatio='xMidYMid slice'
      viewBox='0 0 100 100'
    >
      <defs>
        <Gradient id='gradient' />
      </defs>

      <filter id='blur'>
        <feGaussianBlur in='SourceGraphic' stdDeviation='0.25'/>
      </filter>

      <circle
        transform='rotate(-45 50 50)'
        fill='url(#gradient)'
        filter='url(#blur)'
        cx='50'
        cy='50'
        r='71'
      />
    </svg>
  );
}

export default Background
