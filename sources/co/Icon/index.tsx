import { FC, memo } from 'react'
import config from 'sources/config'
import { IconProps } from './types'

const Icon: FC<IconProps> = ({ name, className }) => (
  <svg fill="currentColor" width="1em" height="1lh" className={className}>
    <use xlinkHref = {`${config.iconsSpriteFile}#${name}`}/>
  </svg>
)

export default memo(Icon)
