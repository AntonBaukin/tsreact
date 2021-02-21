import { AnyAction, Middleware, MiddlewareAPI } from 'redux'
import AppContext from "./AppContext"
import DataUnit, { checkDataUnit } from './DataUnit'
import { unitActionType } from './UnitBase'

export type Reducer = (state: Object, action: AnyAction) => Object

export class Entry
{
	get name() {
		return this.$name
	}

	private readonly $name: string

	get unit() {
		return this.$unit
	}

	private readonly $unit: DataUnit

	get reducer() {
		return this.$reducer
	}

	private readonly $reducer: Reducer | undefined

	isActOn(action: AnyAction): boolean {
		return this.$active && this.unit.isActOn(action)
	}

	private readonly $active: boolean

	constructor(name: string, unit: DataUnit, reducer: Reducer | undefined) {
		this.$name = name
		this.$unit = unit
		this.$reducer = reducer
		this.$active = unit.isActive
	}
}

export type Next = (action: AnyAction) => any

export default class Registry
{
	/* Registry of Data Units */

	get appContext(): AppContext {
		if (this.$appContext === undefined) {
			throw new Error(`Application Context is not defined for Registry`)
		}

		return this.$appContext
	}

	private $appContext: AppContext | undefined

	set appContext(appContext: AppContext) {
		if (this.$appContext !== undefined) {
			throw new Error(`Application Context was defined for Registry`)
		}

		this.$appContext = appContext
	}

	registerUnit(dataUnit: DataUnit) {
		const unitType = unitActionType(checkDataUnit(dataUnit))

		//?: { unit with same FQN is registered }
		if (this.$registry.has(unitType)) {
			throw new Error(
				`Data Unit of class ${dataUnit.constructor.name} ` +
				`is a already registerd under name: ${unitType}`
			)
		}

		//~: add unit to the register
		this.$registry.set(unitType, this.makeEntry(unitType, dataUnit))

		//~: assign the application context
		dataUnit.appContext = this.appContext

		//?: { register reduce unit }
		if (dataUnit.isReducer) {
			this.registerReduceUnit(dataUnit)
		}

		//?: { register active unit }
		if (dataUnit.isActive) {
			this.registerActiveUnit(dataUnit)
		}
	}

	protected registerReduceUnit(dataUnit: DataUnit) {
		const unitType = unitActionType(dataUnit)
		const reduceTypes = dataUnit.reduceTypes

		//?: { unit reduces every action }
		if (reduceTypes === undefined) {
			this.$reduceAny.add(unitType)
			return
		}

		//~: register for each type of interest
		reduceTypes.forEach(type => {
			let unitTypes = this.$reduceMap.get(type)

			if (!unitTypes) {
				unitTypes = new Set<string>()
				this.$reduceMap.set(type, unitTypes)
			}

			unitTypes.add(unitType)
		})
	}

	protected registerActiveUnit(activeUnit: DataUnit) {
		const unitType = unitActionType(activeUnit)
		const actedTypes = activeUnit.actedTypes

		//?: { unit acts on any action }
		if (actedTypes === undefined) {
			this.$actAny.add(unitType)
			return
		}

		//~: register for each type of interest
		actedTypes.forEach(type => {
			let unitTypes = this.$actMap.get(type)

			if (!unitTypes) {
				unitTypes = new Set<string>()
				this.$actMap.set(type, unitTypes)
			}

			unitTypes.add(unitType)
		})
	}

	registerUnits(dataUnits: Array<DataUnit>) {
		dataUnits.forEach(dataUnit => this.registerUnit(dataUnit))
	}

	protected getEntry(unitName: string): Entry {
		const entry = this.$registry.get(unitName)

		//!: note that entry above may be undefined if the action is
		//   not related to data units, but reduce unit was registered.
		if (!entry) {
			throw new Error(`Data unit ${unitName} is not found`)
		}

		return entry
	}

	/**
	 * Maps data unit [instance] name to registration entry.
	 */
	protected readonly $registry = new Map<string, Entry>()

	/**
	 * Maps action type to full names of registered units.
	 * On an action with this name those units will be invoked.
	 */
	protected readonly $reduceMap = new Map<string, Set<string>>()

	/**
	 * Registers reduce units that reduce on every action.
	 */
	protected readonly $reduceAny = new Set<string>()

	/**
	 * Same as $reduceMap, for active units.
	 */
	protected readonly $actMap = new Map<string, Set<string>>()

	/**
	 * Registers active units that act on every action.
	 */
	protected readonly $actAny = new Set<string>()

	protected makeReducer(dataUnit: DataUnit): Reducer | undefined {
		return (state: Object | undefined, action: AnyAction) => (
			dataUnit.reduce(state ?? {}, action)
		)
	}

	protected makeEntry(name: string, dataUnit: DataUnit): Entry {
		const reducer = dataUnit.isReducer ? this.makeReducer(dataUnit) : undefined
		return new Entry(name, dataUnit, reducer)
	}


	/* Registry as a Redux Reducer */

	reducer = (incomeState: Object | undefined, action: AnyAction) => {
		let state: Object = incomeState ?? {}

		//0: reduce with the data unit of the action type (if exists)
		state = this.reduceOwn(state, action)

		//1: reduce with data units that refer this type
		state = this.reduceRefs(state, action)

		//2: reduce with data units that refer this type
		state = this.reduceAny(state, action)

		return state
	}

	protected reduceOwn(state: Object, action: AnyAction): Object {
		//~: lookup entry by action type as it's full name
		const entry = this.$registry.get(action.type)
		if (!entry || !entry.reducer) {
			return state
		}

		//!: reduce with primary data unit
		return entry.reducer(state, action)
	}

	protected reduceElse(state: Object, action: AnyAction, unitName: string): Object {
		//!: exclude unit being the action owner
		if (unitName === action.type) {
			return state
		}

		const entry = this.getEntry(unitName)
		return entry.reducer ? entry.reducer(state, action) : state
	}

	protected reduceRefs(incomeState: Object, action: AnyAction): Object {
		const reduceNames = this.$reduceMap.get(action.type)

		let state = incomeState
		if (reduceNames) {
			reduceNames.forEach(unitName => {
				state = this.reduceElse(state, action, unitName)
			})
		}

		return state
	}

	protected reduceAny(incomeState: Object, action: AnyAction): Object {
		let state = incomeState

		this.$reduceAny.forEach(unitName => {
			state = this.reduceElse(state, action, unitName)
		})

		return state
	}


	/* Registry as a Redux Middleware */

	readonly middleware: Middleware = api => next => action => (
		this.react(api, next, action)
	)

	protected react(api: MiddlewareAPI, next: Next,	action: AnyAction) {
		if (typeof action.type !== 'string') {
			return next(action)
		}

		//0: trigger the data unit of the action type (if exists)
		this.reactOwn(api, action)

		//1: trigger data units that refer this type
		this.reactRefs(api, action)

		//2: trigger data units that refer any type
		this.reactAny(api, action)

		return next(action)
	}

	protected reactOwn(api: MiddlewareAPI, action: AnyAction) {
		//~: lookup entry by action type as it's full name
		const entry = this.$registry.get(action.type)
		if (!entry || !entry.isActOn(action)) {
			return
		}

		//!: invoke primary data unit
		entry.unit.react(action)
	}

	protected reactElse(api: MiddlewareAPI, action: AnyAction, unitName: string) {
		//!: exclude unit acted as the action owner
		if (unitName === action.type) {
			return
		}

		const entry = this.getEntry(unitName)

		//?: { unit responds to this action }
		if (entry.isActOn(action)) {
			entry.unit.react(action)
		}
	}

	protected reactRefs(api: MiddlewareAPI, action: AnyAction) {
		const actedNames = this.$actMap.get(action.type)

		if (actedNames) {
			actedNames.forEach(this.reactElse.bind(this, api, action))
		}
	}

	protected reactAny(api: MiddlewareAPI, action: AnyAction) {
		this.$actAny.forEach(this.reactElse.bind(this, api, action))
	}
}
