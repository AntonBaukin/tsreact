import { number, func } from 'prop-types'
import { createSelector } from 'reselect'
import counter from 'src/main/data/Counter'

export const propTypes = {
	counter: number,
	onIncrement: func.isRequired,
	onDecrement: func.isRequired,
} as const

export interface PropTypes {
	counter?: number,
	onIncrement: () => void,
	onDecrement: () => void,
}

export const defaultProps = {
	onIncrement: counter.bindDispatcher(1),
	onDecrement: counter.bindDispatcher(-1),
} as const

export const mapStateToProps = createSelector(
	counter.selectCounter,
	(counter) => ({ counter }),
)
