import { Icons } from 'sources/co'

export type IconVariant =
  | 'r'   // right position
  | 'rm'  // right position with mirror

export interface ControlIcon {
  i?: Icons,
  iv?: IconVariant,
}

export type ControlAction = () => void
