import { Icons } from 'sources/co'

export type IconVariant =
  | 's' // smaller

export interface ControlIcon {
  icon?: Icons,
  iconVariant?: IconVariant,
}
