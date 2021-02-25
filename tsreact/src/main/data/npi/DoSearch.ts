import { createSelector } from 'reselect'
import { NPI_PAGE_SIZE } from 'src/utils/env'
import UnitBase from 'src/data/UnitBase'
import { NPI, NpiDomain, initialState, SearchParams } from './domain'

export interface SearchPayload {
	searchText: string
}

export default new class extends UnitBase<NpiDomain>
{
	readonly name = 'DoSearch'

	readonly domain = NPI

	readonly initialState = initialState

	makePayload = (searchText: string): SearchPayload => ({ searchText })

	reduceOwnAction(state: Object, payload : SearchPayload) {
		const searchText = cleanSearchText(payload.searchText)
		const domain = this.domainSlice(state)

		if (domain.searchText === searchText) {
			return state
		}

		return this.mergeDomain(state, {
			searchText,
			searchParams: makeParams(searchText),
			page: undefined,
		})
	}

	private readonly selectSlice = (state: Object) => this.domainSlice(state)

	readonly selectPage = createSelector(
		this.selectSlice,
		({ page }) => page
	)
}

function cleanSearchText(searchText: string) {
	return searchText.trim().replace(/\s+/g, ' ').toLocaleLowerCase()
}

function makeParams(searchText: string): SearchParams | undefined {
	const terms = cleanSearchText(searchText)
	//--> *2 to fetch the second page ahead
	const maxList: number = NPI_PAGE_SIZE * 2

	if (terms.length === 0) {
		return undefined
	}

	return { terms, maxList }
}
