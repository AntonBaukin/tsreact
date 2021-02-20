import { Reducer, AnyAction, Middleware, MiddlewareAPI } from 'redux'
import AppContext from "./AppContext"
import DataUnit, { checkDataUnit } from './DataUnit'
import { unitActionType } from './UnitBase'

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

		//?: { register active unit }
		if (dataUnit.isActive) {
			this.registerActiveUnit(dataUnit)
		}
	}

	private registerActiveUnit(activeUnit: DataUnit) {
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

	/**
	 * Maps data unit [instance] name to registration entry.
	 */
	protected readonly $registry = new Map<string, Entry>()

	/**
	 * Maps action type to full names of registered units.
	 * On an action with this name those units will be invoked.
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

		this.$registry.forEach(entry => {
			state = entry.unit.reduce === undefined
				? state
				: entry.unit.reduce(state, action)
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
		//~: lookup entry by action name as it's full name
		const entry = this.$registry.get(action.type)
		if (!entry || !entry.isActOn(action)) {
			return
		}

		//!: invoke primary data unit
		entry.unit.react(action)
	}

	protected reactElse(api: MiddlewareAPI, action: AnyAction, unitName: string) {
		//~: exclude unit acted as the action owner
		if (unitName === action.type) {
			return
		}

		const entry = this.$registry.get(unitName)

		//!: note that entry above may be undefined if the action is
		//   not related to data units, but acted unit was registered.
		if (!entry) {
			throw new Error(`Data unit ${unitName} is not found`)
		}

		//?: { unit responds to this action }
		if (entry.isActOn(action)) {
			entry.unit.react(action)
		}
	}

	protected reactRefs(api: MiddlewareAPI, action: AnyAction) {
		//~: get the names of units to call
		const actedNames = this.$actMap.get(action.type)

		if (actedNames) {
			actedNames.forEach(this.reactElse.bind(this, api, action))
		}
	}

	protected reactAny(api: MiddlewareAPI, action: AnyAction) {
		this.$actAny.forEach(this.reactElse.bind(this, api, action))
	}
}
