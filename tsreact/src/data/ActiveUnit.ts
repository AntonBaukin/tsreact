import { AnyAction } from 'redux'
import RestClient from 'src/rest/RestClient'
import { logAsyncError } from 'src/utils/log'
import DataUnit from './DataUnit'
import UnitBase, { unitActionType } from './UnitBase'

export default abstract class ActiveUnit<LocalType extends Object = Object>
	extends UnitBase<LocalType>
{
	/* Active Unit */

	get isActive() {
		return true
	}

	/**
	 * Lists action types or data units this unit is acts on.
	 * (Predicate isActOn() is also checked.)
	 */
	readonly actsOn: (string | DataUnit)[] = []

	/**
	 * If set true, actsOn is ignored, and this unit
	 * reacts on any action passing isActOn() check.
	 * Overwrite it if defining the flag true.
	 */
	readonly actsOnAny: boolean = false

	/**
	 * By default, active unit acts on own action (having type
	 * of it's full name). Also, it acts on any of ACTS_OWN list.
	 */
	isActOn(action: AnyAction): boolean {
		if (action.type === this.fullName) {
			return true
		}

		if (this.actedTypes !== undefined) {
			return this.actedTypes.has(action.type)
		}

		return false
	}

	get actedTypes(): Set<string> | undefined {
		if (this.actsOnAny === true) {
			return undefined
		}

		if (this.$actedTypes) {
			return this.$actedTypes
		}

		this.$actedTypes = new Set(
			this.actsOn.map(x => typeof x === 'string' ? x : unitActionType(x))
		)

		return this.$actedTypes
	}

	private $actedTypes: Set<string> | undefined


	/* Active Unit Support */

	/**
	 * Returns current Redux state for read only.
	 */
	get state(): Object {
		return this.appContext.store.getState()
	}

	get restClient(): RestClient {
		return this.appContext.restClient
	}

	/**
	 * General version of dispatch that may handle direct actions,
	 * arrays of actions, a promise, or an array of promises.
	 *
	 * You may also overwrite this method to handle specific
	 * results, such as Ajax responses.
	 *
	 * Instead of Redux action you may also use an instance
	 * of DataUnit (that makes action without arguments) to
	 * fire the action of this unit.
	 */
	handleResult = (result: unknown): void => {
		if (result instanceof Promise) {
			this.handlePromise(result as Promise<any>)
		}
		else if (Array.isArray(result)) {
			result.forEach(this.handleResult)
		}
		//?: { a data unit }
		else if (result instanceof DataUnit) {
			this.dispatch(result.makeAction())
		}
		//?: { this is an action via duck typing }
		else if (result instanceof Object && 'type' in result) {
			this.dispatch(result as AnyAction)
		}
	}

	handleError = (result: unknown): void => {
		if (result instanceof Error) {
			this.catchError(result)
			return
		}

		const fallback = this.makeFallback(result)

		if (fallback instanceof Error) {
			this.catchError(fallback)
			return
		} else if (fallback !== undefined) {
			this.handleResult(fallback)
		}
	}

	/**
	 * Asynchronously reacts on an error created when resolving
	 * resulting promise of this thunk.
	 */
	catchError(error : Error) {
		logAsyncError(error)
	}

	/**
	 * Produces an error to catch, or fallback result to handle.
	 */
	makeFallback(result: unknown): Object | Error | undefined {
		return undefined
	}

	handlePromise(promise: Promise<any>): void {
		promise.then(this.handleResult, this.handleError)
	}
}
