import superagent from 'superagent'
import nocache from 'superagent-no-cache'
import { Json } from 'src/utils/json'
import { logRestGet } from 'src/utils/log'
import { UrlParams, makeUrl, addParams, checkEndpoints } from 'src/utils/url'
import { Endpoints } from './Endpoints'

export default class RestClient
{
	constructor() {
		checkEndpoints()
	}

	fetch(endpoint: Endpoints, path: string, params?: UrlParams) {
		const url = addParams(makeUrl(endpoint, path), params)
		logRestGet(url)
		return jsonPromise(superagent.get(url.toString()).use(nocache))
	}
}

/**
 * Helps not to bother with the resulting type.
 */
function jsonPromise(request: any): Promise<Json> {
	return Promise.resolve(request) as Promise<Json>
}
