import { CSSProperties } from 'react'
import bootstrapIcons from "./bootstrap";

export type BootstrapIcons = typeof bootstrapIcons[number]

/**
 * Svg width of an icon is '1em', height — '1lh' (line height).
 * The color — is set via 'currentColor' special value.
 */
export interface IconProps {
  name: BootstrapIcons,
  className?: string,
  style?: object,
}
