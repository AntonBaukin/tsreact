import { createSelector } from 'reselect'
import UnitBase from 'src/data/UnitBase'

export interface CounterType {
	counter: number
}

export interface PayloadType {
	increment: number
}

const initialState = {
	counter: 1,
} as CounterType

export default new class extends UnitBase<CounterType>
{
	readonly name = 'Counter'

	readonly initialState = initialState

	bind(increment: number) {
		return super.bind(increment)
	}

	makePayload(increment: number) {
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
