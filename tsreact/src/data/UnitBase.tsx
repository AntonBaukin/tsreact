import get from 'lodash/get'
import set from 'lodash/set'
import isNil from 'lodash/isNil'
import { AnyAction } from 'redux'
import AppContext from './AppContext'
import DataUnit, { unitFullName } from './DataUnit'

export default abstract class UnitBase<LocalType extends Object> extends DataUnit
{
	/* Data Unit Registration */

	get appContext(): AppContext {
		if (this.$appContext === undefined) {
			throw new Error(`Application Context is not defined for unit ${this.fullName}`)
		}

		return this.$appContext
	}

	private $appContext: AppContext | undefined

	set appContext(appContext: AppContext) {
		if (this.$appContext !== undefined) {
			throw new Error(`Application Context was defined for unit ${this.fullName}`)
		}

		this.$appContext = appContext
	}

	readonly domain = ''

	get domainName() {
		return this.domain
	}

	readonly name: string | undefined

	get unitName() {
		if (this.name === undefined) {
			throw new Error('Data unit name is not specified')
		}

		return this.name
	}

	get fullName(): string {
		return unitFullName(this)
	}


	/* Redux Reducer */

	reduce(state: Object, action: AnyAction): Object {
		if (action.type === this.fullName) {
			return this.reduceOwnAction(state, action.payload)
		}

		return state
	}

	reduceOwnAction(state: Object, payload: any): Object {
		return state
	}

	readonly initialState: LocalType | undefined

	/**
	 * Utility that checks whether incoming state has all the fields
	 * set in the initial state, and merges absent ones.
	 */
	safeState(state: Object): LocalType {
		if (this.initialState === undefined) {
			return state as LocalType
		}

		let result = state
		for (const key of Object.keys(this.initialState)) {
			if (isNil(get(state, key))) {
				if (result === state) {
					result = { ...result, [key]: get(this.initialState, key) }
				} else {
					set(result, key, get(this.initialState, key))
				}
			}
		}

		return result as LocalType
	}


	/* Redux Actions */

	get actionMaker() {
		return this.bindActionMaker()
	}

	bindActionMaker(...boundArgs: any[]) {
		return () => this.makeAction(...boundArgs)
	}

	makeAction(...args: any[]) {
		return {
			type: this.fullName,
			payload: this.makePayload(...args),
		}
	}

	makePayload(...args: any[]): any {
		if (args.length === 1) {
			return args[0]
		}

		throw new Error(`Failed create default payload for unit ${this.fullName}`)
	}

	get dispatcher() {
		return this.bindDispatcher()
	}

	bindDispatcher(...boundArgs: any[]) {
		return () => this.dispatch(...boundArgs)
	}

	/**
	 * Creates action and synchronously dispatches it to Redux.
	 */
	dispatch(...args: any[]): void {
		this.appContext.store.dispatch(this.makeAction(...args))
	}
}
