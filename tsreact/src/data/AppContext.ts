import { createContext } from 'react'
import { Store } from 'redux'
import Registry from './Registry'

export interface Items<State> {
	store: Store,
	registry: Registry<State>
}

/**
 * Read-only access to application-level singletons.
 * Created by an AppContainerBase and provided
 * via React' context.
 */
export default class AppContext<State>
{
	static React = createContext({} as AppContext<any>)

	constructor(items: Items<State>) {
		this.$items = items
	}
	
	private readonly $items: Items<State>

	/**
	 * Redux's Root Store.
	 */
	get store() {
		return this.$items.store
	}

	/**
	 * Instance of Registry.
	 */
	get registry() {
	  return this.$items.registry
	}

	// /**
	//  * Instance of data/RestClient.
	//  */
	// get restClient() {
	//   return this.$items.restClient
	// }
	//
	// /**
	//  * Instance of data/SocketClient (if available).
	//  */
	// get socketClient() {
	//   return this.$items.socketClient
	// }
	//
	// /**
	//  * Instance of AppRoutes.
	//  */
	// get appRoutes() {
	//   return this.$items.appRoutes
	// }
	//
	// /**
	//  * Instance of AppContainerBase.
	//  */
	// get appContainer() {
	//   return this.$items.appContainer
	// }
	//
	// /**
	//  * References to the RootScreen components currently
	//  * rendered. This is JS Map: component name to reference.
	//  *
	//  * Hint: more than a single screen may be rendered
	//  * at a time when they are stacked!
	//  */
	// get rootScreens() {
	//   return this.$rootScreens
	// }
	//
	// $rootScreens = new Map()
	//
	// /**
	//  * Returns RootScreen of this given name, or undefined.
	//  */
	// rootScreen(componentName) {
	//   assert(typeof componentName === "string")
	//   return this.$rootScreens.get(componentName)
	// }
}
