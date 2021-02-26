import { createSelector } from 'reselect'
import FetchUnit, { JsonPayload } from 'src/data/FetchUnit'
import {
	NPI,
	NpiDomain,
	initialState,
	SearchPage,
	FullRecord,
} from './domain'


export default new class extends FetchUnit<NpiDomain>
{
	readonly name = 'FetchRecord'

	readonly domain = NPI

	readonly initialState = initialState

	readonly path = '/'

	readonly actionFromJson = true

	private readonly selectSlice = (state: Object) => this.domainSlice(state)

	readonly selectRecords = createSelector(
		this.selectSlice,
		({ records }) => records
	)
}
