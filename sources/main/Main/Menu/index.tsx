import { FC, useCallback } from 'react'
import cn from 'classnames'
import { Box } from 'sources/co'
import { doChangeRoute } from 'sources/main/routes'
import { useAppSelector } from 'sources/main/store/hooks'
import { menuUnit } from './units'
import MenuItem from './item'
import styles from './styles.module.scss'

const Menu: FC = () => {
  const isMenuCompact = useAppSelector(menuUnit.selectMenuCompact)
  const onAbout = useCallback(() => doChangeRoute('about'), [])

  return (
    <div className={cn(styles.pagemenu, isMenuCompact && styles.compact)}>
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
