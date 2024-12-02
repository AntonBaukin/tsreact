import { VFC, FC, ReactNode } from 'react'
import { Box } from 'sources/co'
import styles from './styles.module.scss'

const Menu: VFC = () => {

  return (
    <div className={styles.pagemenu}>
      <div style={{height: '50px'}}/>

      <Box v="L">
        <Box v="fl" />

        <Box v="f">
          <button>Some text</button>
        </Box>

        <Box v="f">
          <button>More info of a long long content</button>
        </Box>

        <Box v="ff" />

        <Box v="f">
          <button>About</button>
        </Box>

        <Box v="fr" />
      </Box>

    </div>
  )
}

export default Menu
