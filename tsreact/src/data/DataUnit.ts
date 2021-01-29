import isString from 'lodash/isString'
import { AnyAction } from 'redux'
import AppContext from './AppContext'

export default abstract class DataUnit
{
	/* Data Unit Registration */

	/**
	 * Context of the application.
	 * Assigned when unit instance is registered.
	 */
	abstract get appContext(): AppContext

	abstract set appContext(appContext: AppContext)

	/**
	 * Domain name is a string of names with dots.
	 * It's a package, or namespace within the store.
	 * Empty string means the root domain.
	 */
	abstract get domainName(): string

	/**
	 * Name of the model unique within the domain.
	 */
	abstract get unitName(): string


	/* Redux Reducer */

	abstract get isReducer(): boolean

	abstract reduce(state: Object, action: AnyAction): Object

	abstract makeAction(...args: [any]): AnyAction
}

/**
 * Full name of a Data Unit instance — is a type of Redux action.
 */
export const unitFullName = (du: DataUnit) => (
	du.domainName.length === 0 ? du.unitName : `${du.domainName}.${du.unitName}`
)

export const checkDataUnit = (some: Object): DataUnit => {
	const unit = some as DataUnit

	if (!isString(unit.domainName)) {
		throw new Error('Data unit domain name is not specified')
	}

	if (!isString(unit.unitName)) {
		throw new Error('Data unit name is not specified')
	}

	//?: { unit name contains dots or spaces }
	if (/[\s.]/.test(unit.unitName)) {
		throw new Error(`Data unit name is illegal: ${unit.unitName}`)
	}

	return unit
}
