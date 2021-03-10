import { compose, createStore, applyMiddleware } from 'redux'
import { composeWithDevTools } from 'redux-devtools-extension'
import { IS_DEV_ENV, REDUX_DEVTOOLS_OPTS } from 'src/utils/env'

export function createAppStore(reducer, ...middleware) {
	const composeEnhancers = IS_DEV_ENV
		? composeWithDevTools(REDUX_DEVTOOLS_OPTS)
		: compose

	const enhancer = composeEnhancers(
		applyMiddleware(...middleware),
	)

	return createStore(reducer, {}, enhancer)
}
