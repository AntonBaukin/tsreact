import { createContext } from 'react'
import { Store } from 'redux'
import RestClient from 'src/rest/RestClient'
import Registry from './Registry'

export interface Items {
	store: Store,
	registry: Registry,
	restClient: RestClient,
}

/**
 * Read-only access to application-level singletons.
 * Created by an AppContainerBase and provided
 * via React' context.
 */
export default class AppContext
{
	static React = createContext({} as AppContext)

	constructor(items: Items) {
		this.$items = items
	}
	
	private readonly $items: Items

	/**
	 * Redux store.
	 */
	get store() {
		return this.$items.store
	}

	get registry() {
	  return this.$items.registry
	}

	get restClient() {
	  return this.$items.restClient
	}
}
