import { FC, memo } from 'react'
import cn from 'classnames'
import { MenuItemProps } from './types'
import { Box, Icon, Text } from 'sources/co'
import { styles as cstyles } from 'sources/co/controls'
import styles from './styles.module.scss'

const MenuItem: FC<MenuItemProps> = ({ children, icon }) => {
  return (
    <Box>
      <button className={cn(cstyles.control, cstyles.clickable, styles.item)}>
        {icon && (
          <div className={cstyles.icon}>
            <Icon name={icon} />
          </div>
        )}
        <div className={cstyles.text}>
          <Text>{children}</Text>
        </div>
      </button>
    </Box>
  )
}

export default memo(MenuItem)
