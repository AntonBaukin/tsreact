import { FC, memo } from 'react'
import cn from 'classnames'
import { Box, Icon, Text } from 'sources/co'
import { styles as cstyles } from 'sources/co/controls'
import { MenuItemProps } from './types'
import styles from './styles.module.scss'

const MenuItem: FC<MenuItemProps> = ({ children, action, i, iv }) => {
  const icon = i && (
    <div className={cn(cstyles.icon, iv && cstyles[iv])}>
      <Icon name={i} />
    </div>
  );

  return (
    <Box shadow focus>
      <button
        onClick={action}
        className={
          cn(
            cstyles.control,
            i && cstyles[`icon-${iv ?? 'l'}`],
            cstyles.clickable,
            styles.item,
          )
        }
      >
        {i && !iv && icon}
        <div className={cstyles.text}>
          <Text>{children}</Text>
        </div>
        {i && (iv === 'r' || iv === 'rm') && icon}
      </button>
    </Box>
  )
}

export default memo(MenuItem)
