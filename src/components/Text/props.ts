import { string } from 'prop-types'

export const propTypes = {
	lang: string,

	// Code constant of the text block.
	children: string.isRequired,

	// Provide values to substitute in the string template
	// directly as properties of the component. This is
	// handy, but not collide with other properties.
} as const

export interface PropTypes {
	lang?: string,
	children: string,
	[key: string]: string | number | undefined,
}

export const defaultProps = {
} as const
