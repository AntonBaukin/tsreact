import { FC, useCallback } from 'react'
import { Box } from 'sources/co'
import { doChangeRoute } from 'sources/main/routes'
import MenuItem from './item'
import styles from './styles.module.scss'

const Menu: FC = () => {
  const onAbout = useCallback(() => doChangeRoute('about'), [])

  return (
    <div className={styles.pagemenu}>
      <Box v="C">
        <MenuItem i="search">Search</MenuItem>
        <MenuItem>More info of a long long content</MenuItem>
        <Box v="f" />
        <MenuItem action={onAbout}>About</MenuItem>
      </Box>
    </div>
  )
}

export default Menu
