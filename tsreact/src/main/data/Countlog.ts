import { AnyAction } from 'redux'
import ThunkUnit from 'src/data/ThunkUnit'
import counterUnit, { PayloadType } from './Counter'

export default new class extends ThunkUnit
{
	readonly name = 'Countlog'

	readonly reducer = false

	readonly ACTS_ON = [ counterUnit ]

	thunk(action: AnyAction) {
		const payload = action.payload as PayloadType
		const { increment } = payload
		const direction = increment > 0 ? 'Incremented' : 'Decremented'
		console.log(`${direction} counter by ${Math.abs(increment)}`)

		const counter = counterUnit.selectCounter(this.state)
		console.log(`Counter value is ${counter}`)
	}
}
