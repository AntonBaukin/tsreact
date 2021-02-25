import { AnyAction } from 'redux'
import ActiveUnit from 'src/data/ActiveUnit'
import { NPI_PAGES_FETCH } from 'src/utils/env'
import { NPI, NpiDomain, initialState } from './domain'
import doSearch from './DoSearch'

export interface PageIndexPayload {
	index: number
}

export default new class extends ActiveUnit<NpiDomain>
{
	readonly name = 'SetPage'

	readonly domain = NPI

	readonly initialState = initialState

	makePayload = (index: number): PageIndexPayload => ({ index })

	react(action: AnyAction): void {
		const { page, searchParams, searchText } = this.domainSlice(this.state)
		const { index } = action.payload as PageIndexPayload

		if (!page) {
			return
		}

		//~: we plan to fetch more records on the right of current index
		const { total, limit, size } = page
		const newLimit = Math.min((index + NPI_PAGES_FETCH + 1) * size, total)

		//?: { we already asked more records }
		if (newLimit <= limit) {
			return
		}

		doSearch.fire(searchText, newLimit)
	}

	reduceOwnAction(state: Object, { index }: PageIndexPayload) {
		const { page } = this.domainSlice(state)
		return this.mergeDomain(state, { page: { ...page, index } })
	}
}
