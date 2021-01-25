import { AnyAction } from 'redux'
import AppContext from './AppContext'

export interface DataUnitConstructor<State> {
	new (appContext: AppContext<State>): DataUnit<State>
}

/**
 * Data Unit is named handler of the data in the store.
 */
export default class DataUnit<State>
{
	constructor(appContext: AppContext<State>) {
		this.$appContext = appContext
	}

	get appContext() {
		return this.$appContext
	}

	private readonly $appContext: AppContext<State>


	/* Registry Entry */

	static DOMAIN: string = ''

	/**
	 * Domain name is a string of names with dots.
	 * It's a package, or namespace within the store.
	 * Empty string means the root domain.
	 */
	get domainName(): string {
		return (this.constructor as typeof DataUnit).DOMAIN
	}

	/**
	 * Name of the model within the domain.
	 * Defaults to the class name, thus making
	 * a data unit to be a state handling singleton.
	 */
	get unitName(): string {
		return this.constructor.name
	}


	/* Redux Reducer */

	reduce(state: State, action: AnyAction): State {
		return state
	}
}

/**
 * Full name of a Data Unit instance.
 */
export const unitName = <State>(du: DataUnit<State>) => (
	`${du.domainName}.${du.unitName}`
)
