import { CSSProperties } from 'react'
import { string, object, oneOf } from 'prop-types'
import bootstrapIcons from './bootstrap.json'

export const propTypes = {
	name: oneOf(bootstrapIcons).isRequired,
	size: string,
	color: string,
	spriteName: string,
	className: string,
	style: object,
} as const

export interface PropTypes {
	name: string,
	size?: string,
	color?: string,
	spriteName?: string,
	className?: string,
	style?: CSSProperties,
}

export const defaultProps = {
	size: '1em',
	color: 'currentColor',
	spriteName: 'images/icons.svg',
} as const
