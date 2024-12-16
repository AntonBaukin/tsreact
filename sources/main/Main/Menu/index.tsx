import { VFC, FC, ReactNode } from 'react'
import { Box } from 'sources/co'
import MenuItem from './item'
import styles from './styles.module.scss'

const Menu: VFC = () => {

  return (
    <div className={styles.pagemenu}>
      <Box v="C">
        <MenuItem icon="search">Search</MenuItem>
        <MenuItem>More info of a long long content</MenuItem>
        <Box v="f" />
        <MenuItem>About</MenuItem>
      </Box>
    </div>
  )
}

export default Menu
