import { createSelector } from 'reselect'
import UnitBase from 'src/data/UnitBase'

interface CounterType {
	counter: number
}

const initialState = {
	counter: 1,
} as CounterType

export default new class extends UnitBase<CounterType>
{
	readonly name = 'Counter'

	readonly initialState = initialState

	private readonly selectSlice = (state: Object) => this.safeState(state)

	readonly selectCounter = createSelector(
		this.selectSlice,
		({ counter }) => counter
	)

	reduceOwnAction(state: Object, inc = 1) {
		const { counter } = this.safeState(state)

		return {
			...state,
			counter: counter + inc,
		}
	}
}
