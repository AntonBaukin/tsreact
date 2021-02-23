import { ReactNode } from 'react'
import { object } from 'prop-types'
import { RouteConfig } from 'react-router-config'

export const propTypes = {
	route: object.isRequired,
} as const

export interface PropTypes {
	route: RouteConfig,
}

export const defaultProps = {
} as const
