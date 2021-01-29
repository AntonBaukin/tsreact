import { createSelector } from 'reselect'
import UnitBase from 'src/data/UnitBase'

interface CounterType {
	counter: number
}

interface PayloadType {
	increment: number
}

const initialState = {
	counter: 1,
} as CounterType

export default new class extends UnitBase<CounterType>
{
	readonly name = 'Counter'

	readonly initialState = initialState

	makePayload(increment: integer) {
		return { increment }
	}

	private readonly selectSlice = (state: Object) => this.safeState(state)

	readonly selectCounter = createSelector(
		this.selectSlice,
		({ counter }) => counter
	)

	reduceOwnAction(state: Object, { increment } : PayloadType) {
		const { counter } = this.safeState(state)
		return {	...state, counter: counter + increment }
	}
}
