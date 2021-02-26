import UnitBase from 'src/data/UnitBase'
import { NPI, NpiDomain, initialState, FullRecord } from './domain'

export default new class extends UnitBase<NpiDomain>
{
	readonly name = 'SaveRecord'

	readonly domain = NPI

	readonly initialState = initialState

	makePayload = (record: FullRecord) => record

	reduceOwnAction(state: Object, payload: FullRecord) {
		const { records } = this.domainSlice(state)
		return this.mergeDomain(state, { records: [payload, ...records] })
	}
}
