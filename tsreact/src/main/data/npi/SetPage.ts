import UnitBase from 'src/data/UnitBase'
import { NPI, NpiDomain, initialState } from './domain'

export interface PageIndexPayload {
	index: number
}

export default new class extends UnitBase<NpiDomain>
{
	readonly name = 'SetPage'

	readonly domain = NPI

	readonly initialState = initialState

	makePayload = (index: number): PageIndexPayload => ({ index })

	reduceOwnAction(state: Object, { index }: PageIndexPayload) {
		const { page } = this.domainSlice(state)
		return this.mergeDomain(state, { page: { ...page, index } })
	}
}
