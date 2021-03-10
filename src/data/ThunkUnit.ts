import { AnyAction } from 'redux'
import ActiveUnit from './ActiveUnit'

export default abstract class ThunkUnit<LocalType extends Object = Object>
	extends ActiveUnit<LocalType>
{
	/* Thunk Unit */

	/**
	 * If this flag is true, the thunk is invoked after the reducer.
	 * Alter it to read the state before the action completes.
	 */
	readonly postpone: boolean = true

	/**
	 * Does the stuff. This function may be asynchronous.
	 * Note that by default a thunk unit reacts on the own action,
	 * and any action it is subscribed for in «actsOn» list.
	 */
	abstract thunk(action: AnyAction): void | Promise<any>

	react(action: AnyAction): void {
		if (this.postpone) {
			setTimeout(() => this.handleResult(this.thunk(action)), 0)
		} else {
			this.handleResult(this.thunk(action))
		}
	}
}
