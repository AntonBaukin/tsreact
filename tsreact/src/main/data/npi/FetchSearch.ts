import isEqual from 'lodash/isEqual'
import FetchUnit, { JsonPayload } from 'src/data/FetchUnit'
import { Json } from 'src/utils/objects'
import { NPI, NpiDomain, initialState, SearchParams } from './domain'
import doSearch from './DoSearch'

export default new class extends FetchUnit<NpiDomain>
{
	readonly name = 'FetchSearch'

	readonly domain = NPI

	readonly actsOn = [doSearch]

	readonly initialState = initialState

	readonly path = '/search'

	readonly actionFromJson = true

	makeParamsFromSlice(slice: NpiDomain) {
		return this.toParams(slice.searchParams)
	}

	reduceOwnAction(state: Object, payload: JsonPayload<NpiDomain>) {
		const requestParams = this.makeParamsFromSlice(payload.slice)
		const actualParams = this.makeParamsFromSlice(this.domainSlice(state))

		//?: { this request is obsolete }
		if (!isEqual(requestParams, actualParams)) {
			return state
		}

		return state
	}
}
