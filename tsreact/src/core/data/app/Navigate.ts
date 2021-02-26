import { AnyAction } from 'redux'
import ActiveUnit from 'src/data/ActiveUnit'
import { UrlParams } from 'src/utils/url'
import { Domains } from '../domains'

export enum NavigateType {
	POP = 'pop',
	PUSH = 'push',
	REPLACE = 'replace'
}

export interface NavigatePayload
{
	type: NavigateType

	/**
	 * Required for push and replace types.
	 */
	path?: string,

	/**
	 * TODO support URL parameters when navigating.
	 */
	params?: UrlParams,
}

export default new class extends ActiveUnit
{
	readonly name = 'Navigate'

	readonly domain = Domains.APP

	readonly reducer = false

	makePayload = (payload: NavigatePayload) => payload

	push(path: string) {
		this.fire({ type: NavigateType.PUSH, path })
	}

	replace(path: string) {
		this.fire({ type: NavigateType.REPLACE, path })
	}

	pop() {
		this.fire({ type: NavigateType.POP })
	}

	react(action: AnyAction): void {
		const { type, path } = action.payload as NavigatePayload

		switch (type) {
			case NavigateType.POP: {
				this.history.goBack()
				break
			}

			case NavigateType.PUSH: {
				if (!path) {
					throw new Error('History push requires a path')
				}

				this.history.push(path)
				break
			}

			case NavigateType.REPLACE: {
				if (!path) {
					throw new Error('History replace requires a path')
				}

				this.history.replace(path)
				break
			}
		}
	}
}
