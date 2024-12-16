import bootstrapIcons from "./bootstrap";

export type Icons = typeof bootstrapIcons[number]

/**
 * Svg width of an icon is '1em', height — '1lh' (line height).
 * The color — is set via 'currentColor' special value.
 */
export interface IconProps {
  name: Icons,
  className?: string,
}
