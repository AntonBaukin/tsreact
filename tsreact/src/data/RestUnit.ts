import { AnyAction } from 'redux'
import { Response } from 'superagent'
import { Endpoints } from 'src/rest/Endpoints'
import { UrlParams, MIME_JSON } from 'src/utils/url'
import { Json } from 'src/utils/objects'
import ThunkUnit from './ThunkUnit'

/**
 * Payload of unit's own action created as the response.
 */
export interface ResponsePayload<LocalType>
{
	/**
	 * Action that caused this request (with this response).
	 */
	action: AnyAction,

	/**
	 * State at the time of fetching.
	 */
	slice: LocalType,

	/**
	 * Full response.
	 */
	response: Response,
}

export interface JsonPayload<LocalType> extends ResponsePayload<LocalType>
{
	/**
	 * Response text as a JSON object.
	 */
	json: Json
}


/**
 * Unit responsible for making asynchronous query, transforming
 * the result, reducing or reporting it with else unit.
 *
 * Any active unit may issue Ajax requests. A thunk or saga unit
 * may do many things. In contrary, rest unit has single goal.
 */
export default abstract class RestUnit<LocalType extends Object = Object>
	extends ThunkUnit<LocalType>
{
	/* Rest Unit */

	readonly endpoint: Endpoints = Endpoints.MAIN

	/**
	 * Specify the path of the request.
	 */
	readonly path: string = '/'

	/**
	 * When unit handles HTTP response with JSON content,
	 * if this flag is true, it fires own action with
	 * payload being this JSON (Object).
	 *
	 * If this flag is set true, the unit does not act on
	 * own action (as infinite fetch cycle starts)!
	 */
	readonly actionFromJson: boolean = false

	/**
	 * Depending on implementation this flag means not to issue
	 * the request when it's nothing to send.
	 *
	 * For HTTP GET requests, if makeParams() returns undefined
	 * or empty object, the request is not sent.
	 */
	readonly emptyRequests: boolean = false

	/**
	 * Create the parameters of the URL from the action.
	 * (You may also access Redux current state.)
	 *
	 * This is required mostly for HTTP GET requests,
	 * but may be handy for the other types.
	 */
	makeParams(action: AnyAction): UrlParams | undefined {
		return this.makeParamsFromSlice(this.domainSlice(this.state))
	}

	makeParamsFromSlice(slice: LocalType): UrlParams | undefined {
		return undefined
	}

	/**
	 * Handy type rewriter not to import UrlParams from each unit.
	 */
	toParams(params: Object | undefined): UrlParams | undefined {
		return params === undefined ? undefined : params as UrlParams
	}

	handleResponse(
		action: AnyAction,
		slice: LocalType,
		x: unknown
	): void | Promise<any> {
		if (typeof x !== 'object' || !x || !('xhr' in x)) {
			this.handleError(new Error('Invalid HTTP response object'))
		} else {
			return this.handleHttpResponse(action, slice, x as Response)
		}
	}

	handleHttpResponse(
		action: AnyAction,
		slice: LocalType,
		response: Response
	): void | Promise<any> {
		if (response.error || !response.ok) {
			return this.handleHttpError(action, slice, response)
		}

		return this.handleSuccess(action, slice, response)
	}

	handleHttpError(
		action: AnyAction,
		slice: LocalType,
		response: Response
	): void | Promise<any> {
		if (response.error) {
			return this.handleError(response.error)
		}
	}

	handleSuccess(
		action: AnyAction,
		slice: LocalType,
		response: Response
	): void | Promise<any> {
		if (response.type === MIME_JSON) {
			let json: Json

			try {
				json = JSON.parse(response.text)
			} catch(e: any) {
				this.handleError(e)
				return
			}

			return this.handleJson(json, action, slice, response)
		}

		return undefined
	}

	handleJson(
		json: Json,
		action: AnyAction,
		slice: LocalType,
		response: Response
	): void | Promise<any> {
		if (this.actionFromJson) {
			return Promise.resolve({
				type: this.fullName,
				payload: { action, slice, response, json } as JsonPayload<LocalType>
			})
		}
	}


	/* Active Unit */

	isActOnOwn(action: AnyAction): boolean {
		return !this.actionFromJson
	}
}
