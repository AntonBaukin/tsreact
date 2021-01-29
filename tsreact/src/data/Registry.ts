import { Reducer, AnyAction } from 'redux'
import AppContext from "./AppContext"
import DataUnit, { unitFullName, checkDataUnit } from './DataUnit'

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

	constructor(name: string, unit: DataUnit, reducer: Reducer | undefined) {
		this.$name = name
		this.$unit = unit
		this.$reducer = reducer
	}
}

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
		const fullName = unitFullName(checkDataUnit(dataUnit))

		//?: { unit with same FQN is registered }
		if (this.$registry.has(fullName)) {
			throw new Error(
				`Data Unit of class ${dataUnit.constructor.name} ` +
				`is a already registerd under name: ${fullName}`
			)
		}

		//~: add unit to the register
		this.$registry.set(fullName, this.makeEntry(fullName, dataUnit))

		//~: assign the application context
		dataUnit.appContext = this.appContext
	}

	registerUnits(dataUnits: Array<DataUnit>) {
		dataUnits.forEach(dataUnit => this.registerUnit(dataUnit))
	}

	/**
	 * Maps data unit [instance] name to registered instance.
	 */
	$registry = new Map<String, Entry>()

	protected makeReducer(dataUnit: DataUnit): Reducer {
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
}
