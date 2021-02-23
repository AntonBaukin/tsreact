import { ReactNode } from 'react'
import { string, node } from 'prop-types'

export const propTypes = {
	children: node,
	className: string,
} as const

export interface PropTypes {
	children?: ReactNode,
	className?: string,
}

export const defaultProps = {
} as const
