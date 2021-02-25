import every from 'lodash/every'
import isNil from 'lodash/isNil'
import { AnyAction } from 'redux'
import { Endpoints } from 'src/rest/Endpoints'
import { UrlParams } from 'src/utils/url'
import RestUnit, { ResponsePayload, JsonPayload } from './RestUnit'

export type { ResponsePayload, JsonPayload } from './RestUnit'

/**
 * Unit to fetch data via HTTP GET request.
 * Has rigid responsibility and configuration.
 */
export default abstract class FetchUnit<LocalType extends Object = Object>
	extends RestUnit<LocalType>
{
	/* Thunk Unit */

	thunk(action: AnyAction): void | Promise<any> {
		const slice = this.domainSlice(this.state)
		const params = this.makeParams(action)
		const isEmpty = params === undefined || every(params, isNil)

		if (isEmpty && !this.emptyRequests) {
			return
		}

		return this.restClient.fetch(this.endpoint, this.path, params)
			.then(this.handleResponse.bind(this, action, slice), this.handleError)
	}
}
