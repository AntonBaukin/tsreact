import { VFC, FC, ReactNode } from 'react'
import { Box } from 'sources/co'
import styles from './styles.module.scss'

const Menu: VFC = () => {

  return (
    <div className={styles.pagemenu}>
      <div style={{height: '50px'}}/>

      <Box v="C">
        <Box>
          <button>Some text</button>
        </Box>

        <Box>
          <button>More info of a long long content</button>
        </Box>

        <Box v="f" />

        <Box>
          <button>About</button>
        </Box>
      </Box>

    </div>
  )
}

export default Menu
