import get from 'lodash/get'
import isEmpty from 'lodash/isEmpty'
import { Endpoints } from 'src/rest/Endpoints'
import { ENDPOINTS } from './env'

export const MIME_JSON = 'application/json'

export type UrlParamValue = string | number | boolean | undefined | null

export interface UrlParams {
	[name: string]: UrlParamValue
}

export const joinUrl = (url: string, path: string): string => (
	url.endsWith('/')
		? url.concat(path.startsWith('/') ? path.substring(1) : path)
		: url.concat(path.startsWith('/') ? '' : '/', path)
)

export const makeUrl = (endpoint: Endpoints, path: string): URL => (
	new URL(joinUrl(get(ENDPOINTS, endpoint) as string, path))
)

export const addParams = (url: URL, params: UrlParams | undefined | null): URL => {
	const result = new URL(url.toString())

	if (!isEmpty(params)) {
		const ps = new URLSearchParams(url.search)

		Object.entries(params!).forEach(([name, value]) => {
			if (value !== null && value !== undefined) {
				ps.append(name, typeof value === 'string' ? value : String(value))
			}
		})

		result.search = ps.toString()
	}

	return result
}

export function checkEndpoints(): void {
	if (isEmpty(ENDPOINTS)) {
		throw new Error('Endpoints are not configured in config.json file')
	}

	Object.values(Endpoints).forEach(name => {
		const value: unknown = get(ENDPOINTS, name)

		if (typeof value !== 'string') {
			throw new Error(`Endpoint ${name} is not specified in config.json`)
		}

		let protocol: string | undefined

		try {
			const url = new URL(value)
			protocol = url.protocol
		} catch(e: any) {
			throw new Error(`Wrong URL format for endpoint ${name}: ${value}`)
		}

		if (!['http:', 'https:'].includes(protocol)) {
			throw new Error(`Endpoint ${name} is not of HTTP(S) protocol: ${value}`)
		}
	})
}
