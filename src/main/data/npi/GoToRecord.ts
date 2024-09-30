import { AnyAction } from 'redux'
import ActiveUnit from 'src/data/ActiveUnit'
import navigate from 'src/core/data/app/Navigate'
import { NPI, NpiDomain, initialState } from './domain'

export interface GoToRecordPayload {
	id: string
}

class GoToRecord extends ActiveUnit<NpiDomain>
{
	readonly name = 'GoToRecord'

	readonly domain = NPI

	readonly initialState = initialState

	makePayload = (id: string): GoToRecordPayload => ({ id })

	react(action: AnyAction): void {
		const { id } = action.payload as GoToRecordPayload
		navigate.push(`/record/${id}`)
	}
}

export default new GoToRecord()
