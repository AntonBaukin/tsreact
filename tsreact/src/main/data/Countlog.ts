import { AnyAction } from 'redux'
import ThunkUnit from 'src/data/ThunkUnit'
import counterUnit, { CounterType, PayloadType } from './Counter'

export default new class extends ThunkUnit<CounterType>
{
	readonly name = 'Countlog'

	readonly reduceOn = [ counterUnit ]

	readonly actsOn = [ counterUnit ]

	thunk(action: AnyAction) {
		const payload = action.payload as PayloadType
		const { increment } = payload
		const direction = increment > 0 ? 'Incremented' : 'Decremented'
		console.log(`${direction} counter by ${Math.abs(increment)}`)

		const counter = counterUnit.selectCounter(this.state)
		console.log(`Counter value now is ${counter}`)
	}

	reduce(state: Object, action: AnyAction): Object {
		const { counter } = this.domainSlice(state)
		console.log(`Counter in logger reducer ${counter}`)
		return state
	}
}
