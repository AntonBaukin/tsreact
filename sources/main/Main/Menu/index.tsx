import { FC } from 'react'
import { Box } from 'sources/co'
import MenuItem from './item'
import styles from './styles.module.scss'


const Menu: FC = () => {
  return (
    <div className={styles.pagemenu}>
      <Box v="C">
        <MenuItem i="search">Search</MenuItem>
        <MenuItem>More info of a long long content</MenuItem>
        <Box v="f" />
        <MenuItem>About</MenuItem>
      </Box>
    </div>
  )
}

export default Menu
