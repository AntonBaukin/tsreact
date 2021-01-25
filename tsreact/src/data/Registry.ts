import { Reducer, AnyAction } from 'redux'
import DataUnit, { DataUnitConstructor, unitName } from './DataUnit'
import AppContext from "./AppContext"

export class Entry<State>
{
	get name() {
		return this.$name
	}

	private readonly $name: string

	get unit() {
		return this.$unit
	}

	private readonly $unit: DataUnit<State>

	get reducer() {
		return this.$reducer
	}

	private readonly $reducer: Reducer<State>

	constructor(name: string, unit: DataUnit<State>, reducer: Reducer<State>) {
		this.$name = name
		this.$unit = unit
		this.$reducer = reducer
	}
}

export default class Registry<State>
{
	/* Registry of Data Units */

	registerUnit(dataUnit: DataUnit<State>) {
		const fullName = unitName(dataUnit)

		if (this.$registry.has(fullName)) {
			throw new Error(
				`Data Unit of class ${dataUnit.constructor.name} ` +
				`is a already registerd under name: ${fullName}!`
			)
		}

		this.$registry.set(fullName, this.makeEntry(fullName, dataUnit))
	}

	registerUnits(
		appContext: AppContext<State>,
		dataUnits: Array<DataUnitConstructor<State>>
	) {
		dataUnits.forEach(DataUnitClass => new DataUnitClass(appContext))
	}

	/**
	 * Maps data unit [instance] name to registered instance.
	 */
	$registry = new Map<String, Entry<State>>()

	protected makeReducer(dataUnit: DataUnit<State>): Reducer<State> {
		return (state: State | undefined, action: AnyAction) => (
			dataUnit.reduce(state ?? ({} as State), action)
		)
	}

	protected makeEntry(name: string, dataUnit: DataUnit<State>): Entry<State> {
		return new Entry<State>(name, dataUnit, this.makeReducer(dataUnit))
	}


	/* Registry as a Redux Reducer */

	reducer = (incomeState: State | undefined, action: AnyAction) => {
		let state: State = incomeState ?? ({} as State)

		this.$registry.forEach(entry => {
			state = entry.unit.reduce(state, action)
		})

		return state
	}
}
