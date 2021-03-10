import { AnyAction } from 'redux'
import { createSelector } from 'reselect'
import FetchUnit from 'src/data/FetchUnit'
import { Json } from 'src/utils/objects'
import { TxFullRecord } from './TxSearch'
import saveRecord from './SaveRecord'
import {
	NPI,
	NpiDomain,
	initialState,
	SearchPage,
	FullRecord,
} from './domain'


export interface FetchRecordPayload {
	id: string
}

/**
 * The fields we load.
 * See https://clinicaltables.nlm.nih.gov/apidoc/npi_idv/v3/doc.html
 */
const ef = [
	'gender',
	'addr_practice.country',
	'addr_practice.state',
	'addr_practice.city',
	'addr_practice.phone',
].join(',')

export default new class extends FetchUnit<NpiDomain>
{
	readonly name = 'FetchRecord'

	readonly domain = NPI

	readonly initialState = initialState

	readonly path = '/search'

	readonly reducer = false

	makePayload = (id: string): FetchRecordPayload => ({ id })

	makeParams(action: AnyAction) {
		const { id } = action.payload as FetchRecordPayload
		// So, we expect the ID to be so unique that it almost
		// never appears in other fields, such as address.
		// TxFullRecord transformer does the search.
		return this.toParams({ terms: id, ef })
	}

	handleJson(json: Json, action: AnyAction) {
		const { id } = action.payload as FetchRecordPayload
		const record = new TxFullRecord().$init(json, id).$transform()
		saveRecord.fire(record)
	}

	private readonly selectSlice = (state: Object) => this.domainSlice(state)

	readonly selectRecords = createSelector(
		this.selectSlice,
		({ records }) => records
	)
}
