import { compose, createStore, applyMiddleware } from 'redux'
import { composeWithDevTools } from 'redux-devtools-extension'
import { IS_DEV_ENV, DEVTOOLS_REDUX } from 'src/utils/env'

export function createAppStore(reducer, ...middleware) {
	const composeEnhancers = IS_DEV_ENV
		? composeWithDevTools(DEVTOOLS_REDUX)
		: compose

	const enhancer = composeEnhancers(
		applyMiddleware(...middleware),
	)

	return createStore(reducer, {}, enhancer)
}
