import UnitBase from 'src/data/UnitBase'
import DOMAINS from 'src/data/domains.json'
import AppContext from 'src/data/AppContext'

export default new class extends UnitBase
{
	readonly domain = DOMAINS.CORE

	readonly name = 'AppInit'

	readonly reducer = false

	makePayload(appContext: AppContext) {
		return { appContext }
	}
}
