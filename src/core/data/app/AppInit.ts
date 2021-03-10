import UnitBase from 'src/data/UnitBase'
import AppContext from 'src/data/AppContext'
import { Domains } from '../domains'

export default new class extends UnitBase
{
	readonly domain = Domains.APP

	readonly name = 'AppInit'

	readonly reducer = false

	makePayload(appContext: AppContext) {
		return { appContext }
	}
}
