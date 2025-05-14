import { Icons } from 'sources/co'
import { ControlAction, ControlIcon } from 'sources/co/controls'

export interface MenuItemProps extends ControlIcon {
  children: string,
  action?: ControlAction,
}
