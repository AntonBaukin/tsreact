import { ReactNode } from 'react'
import { func, object, arrayOf, node, oneOfType } from 'prop-types'
import { RouteConfig } from 'react-router-config'
import AppContext from 'src/data/AppContext'
import appInit from 'src/core/data/app/AppInit'

export const propTypes = {
	appContext: object.isRequired,

	// Routes configuration object.
	routes: oneOfType([object, arrayOf(object)]),

	// Render the given content instead of the routes.
	children: node,

	// Invoked on the component mount.
	// Default implementation fires AppInit action.
	onAppInit: func,
} as const

export interface PropTypes {
	appContext: AppContext,
	children?: ReactNode,
	routes?: RouteConfig | RouteConfig[],
	onAppInit: (appContext: AppContext) => void,
}

export const defaultProps = {
	onAppInit: appInit.curry(),
} as const
