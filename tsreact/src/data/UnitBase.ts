import get from 'lodash/get'
import set from 'lodash/set'
import isNil from 'lodash/isNil'
import { AnyAction } from 'redux'
import { deepSet } from 'src/utils/objects'
import AppContext from './AppContext'
import DataUnit, { unitFullName } from './DataUnit'

export default abstract class UnitBase<LocalType extends Object = Object> extends DataUnit
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

	readonly domain: string = ''

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
		if (this.$fullName) {
			return this.$fullName
		}

		return this.$fullName = unitFullName(this)
	}

	private $fullName: string | undefined


	/* Redux Reducer */

	readonly reducer: boolean = true

	/**
	 * Lists action types or data units this unit is acts on.
	 * (Predicate isActOn() is also checked.)
	 */
	readonly reduceOn: (string | DataUnit)[] = []

	/**
	 * If set true, actsOn is ignored, and this unit
	 * reacts on any action passing isActOn() check.
	 * Overwrite it if defining the flag true.
	 */
	readonly reduceOnAny: boolean = false

	get isReducer(): boolean {
		return this.reducer !== false
	}

	get reduceTypes(): Set<string> | undefined {
		if (this.reduceOnAny === true) {
			return undefined
		}

		if (this.$reduceTypes) {
			return this.$reduceTypes
		}

		this.$reduceTypes = new Set(
			this.reduceOn.map(x => typeof x === 'string' ? x : unitActionType(x))
		)

		return this.$reduceTypes
	}

	private $reduceTypes: Set<string> | undefined

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

	/**
	 * If domain is empty string, safely returns the incoming state.
	 * Else, selects sub-object by the domain path, and safely returns it.
	 */
	domainSlice(state: Object): LocalType {
		return this.safeState(this.domain.length === 0 ? state : get(state, this.domain, {}))
	}

	/**
	 * Redux safe utility. Merges the given delta of the domain
	 * model into the global state.
	 */
	mergeDomain(state: Object, domain: Object): Object {
		if (this.domain.length === 0) {
			return {	...state, ...domain }
		}

		const slice = { ...this.domainSlice(state), ...domain }
		return deepSet(state, this.domain, slice)
	}

	/**
	 * Use with care! In complex models you likely need
	 * to merge, even to clean up.
	 */
	replaceDomain(state: Object, domain: LocalType): Object {
		return this.domain.length === 0
			? domain
			: deepSet(state, this.domain, domain)
	}


	/* Redux Actions */

	curryActionMaker(...boundArgs: any[]) {
		return (...callArgs: any[]) => this.makeAction(...boundArgs, ...callArgs)
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
		if (args.length === 0) {
			return undefined
		}

		if (args.length === 1) {
			return args[0]
		}

		throw new Error(`Failed create default payload for unit ${this.fullName}`)
	}

	/**
	 * Bound fire without arguments. Useful only when
	 * the action maker of this unit has no arguments.
	 */
	get bound(): (() => void) {
		if (this.$bound === undefined) {
			this.$bound = this.bind()
		}

		return this.$bound
	}

	$bound: undefined | (() => void)

	/**
	 * Returns function with bound arguments that fire the action
	 * of this unit. Note that if this unit is active, it may react
	 * on own action or other. All arguments given to the resulting
	 * function at the call time are ignored. This is useful for
	 * on-click handlers not to mess with the event.
	 */
	bind(...boundArgs: any[]) {
		return () => this.fire(...boundArgs)
	}

	/**
	 * Returns single instance of fire curried without arguments.
	 * Useful in the most cases: when all call arguments are passed
	 * to the action maker of this unit.
	 */
	get curried(): ((...callArgs: any[]) => void) {
		if (this.$curried === undefined) {
			this.$curried = this.curry()
		}

		return this.$curried
	}

	$curried: undefined | ((...callArgs: any[]) => void)

	/**
	 * Unlike bind, curried all the arguments given, followed by
	 * the arguments of the call time.
	 */
	curry(...boundArgs: any[]) {
		return (...callArgs: any[]) => this.fire(...boundArgs, ...callArgs)
	}

	/**
	 * Creates action and synchronously dispatches it to Redux.
	 */
	fire(...args: any[]): void {
		this.dispatch(this.makeAction(...args))
	}

	/**
	 * Synchronously dispatches given action to Redux.
	 * This call is allowed only in UI handlers, or
	 * inside react() of active units.
	 */
	dispatch(action: AnyAction): void {
		this.appContext.store.dispatch(action)
	}


	/* Active Unit */

	get isActive() {
		return false
	}

	isActOn(action: AnyAction): boolean {
		return false
	}

	private static EMPTY_SET = new Set<string>()

	/**
	 * Returns empty set of action types, hence this unit
	 * (if active) may act only on it's own action.
	 */
	get actedTypes(): Set<string> | undefined {
		return UnitBase.EMPTY_SET
	}

	react(action: AnyAction): void {
		throw new Error('Active Unit implementation is required')
	}
}

export function unitActionType(du: DataUnit) {
	return du instanceof UnitBase ? du.fullName : unitFullName(du)
}
