import thunk from 'redux-thunk'
import Registry from 'src/data/Registry'

export default (registry: Registry) => [
	thunk,
	registry.middleware,
] as const
