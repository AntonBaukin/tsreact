import isEqual from 'lodash/isEqual'
import { createSelector } from 'reselect'
import { NPI_PAGE_SIZE, NPI_PAGES_FETCH } from 'src/utils/env'
import UnitBase from 'src/data/UnitBase'
import { NPI, NpiDomain, initialState, SearchParams } from './domain'

export interface SearchPayload {
	searchText: string
	limit?: number
}

export default new class extends UnitBase<NpiDomain>
{
	readonly name = 'DoSearch'

	readonly domain = NPI

	readonly initialState = initialState

	fire(searchText: string, limit?: number) {
		super.fire(searchText, limit)
	}

	makePayload(searchText: string, limit?: number): SearchPayload {
		return ({ searchText, limit })
	}

	reduceOwnAction = this.sliceProducer((slice: NpiDomain, payload: SearchPayload) => {
		const searchText = cleanSearchText(payload.searchText)
		const searchParams = makeParams(searchText, payload.limit)

		if (isEqual(slice.searchParams, searchParams)) {
			return
		}

		if (!isEqual(slice.page?.params.terms, searchParams?.terms)) {
			slice.page = undefined //<— reset search results
		}

		Object.assign(slice, { searchText, searchParams })
	})

	private readonly selectSlice = (state: Object) => this.domainSlice(state)

	readonly selectSearchText = createSelector(
		this.selectSlice,
		({ searchText }) => searchText
	)

	readonly selectPage = createSelector(
		this.selectSlice,
		({ page }) => page
	)
}

function cleanSearchText(searchText: string) {
	return searchText.trim().replace(/\s+/g, ' ').toLocaleLowerCase()
}

function makeParams(
	searchText: string,
	limit?: number,
): SearchParams | undefined {
	const terms = cleanSearchText(searchText)
	const maxList = limit || NPI_PAGE_SIZE * NPI_PAGES_FETCH

	if (terms.length === 0) {
		return undefined
	}

	return { terms, maxList }
}
