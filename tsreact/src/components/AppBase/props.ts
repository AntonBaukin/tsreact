import { ReactNode } from 'react'
import { func, object, node } from 'prop-types'
import AppContext from 'src/data/AppContext'
import appInit from 'src/core/data/app/AppInit'

export const propTypes = {
	children: node,
	appContext: object,
	onAppInit: func,
} as const

export interface PropTypes {
	children: ReactNode | undefined,
	appContext: AppContext,
	onAppInit: (appContext: AppContext) => void,
}

export const defaultProps = {
	onAppInit: appInit.curry(),
} as const
