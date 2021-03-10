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

	/**
	 * If this data unit is a reducer, it may reduce not only
	 * on own action, but on any action type from the resulting
	 * set, or even any action, if the result is undefined.
	 */
	abstract get reduceTypes(): Set<string> | undefined

	abstract reduce(state: Object, action: AnyAction): Object

	abstract makeAction(...args: any[]): AnyAction


	/* Active Unit */

	abstract get isActive(): boolean

	abstract isActOn(action: AnyAction): boolean

	/**
	 * Returns a set of Redux action types this unit acts on.
	 * Undefined result means that the unit checks any action
	 * with it's predicate isActOn().
	 */
	abstract get actedTypes(): Set<string> | undefined

	/**
	 * If unit is active and responds to the given action, this
	 * method is invoked by the middleware to cause side-effects.
	 */
	abstract react(action: AnyAction): void
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
