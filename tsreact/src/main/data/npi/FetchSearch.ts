import get from 'lodash/get'
import isEqual from 'lodash/isEqual'
import FetchUnit, { JsonPayload } from 'src/data/FetchUnit'
import { Json } from 'src/utils/objects'
import { NPI_PAGE_SIZE } from 'src/utils/env'
import { TxSearchResults } from './TxSearch'
import doSearch from './DoSearch'
import {
	NPI,
	NpiDomain,
	initialState,
	SearchParams,
	SearchResults,
	SearchPage,
} from './domain'

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
		const requestParams = payload.slice.searchParams
		const actualParams = this.domainSlice(state).searchParams

		//?: { this request is obsolete }
		if (!isEqual(requestParams, actualParams)) {
			return state
		}

		const data = TxSearchResults.one<SearchResults>(payload.json)
		if (!data) {
			return state
		}

		const domain = this.domainSlice(state)
		const page: SearchPage = {
			total: data.total,
			limit: requestParams!.maxList,
			size: NPI_PAGE_SIZE,
			index: get(domain.page, 'index', 0),
			params: requestParams!,
			records: data.records,
		}

		return this.mergeDomain(state, { page })
	}
}
