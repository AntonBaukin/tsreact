import { connect } from 'react-redux'
import classNames from 'classnames'
import { PropTypes, propTypes, defaultProps, mapStateToProps } from './props'
import styles from './styles.module.scss'

const Counter = ({ counter, onIncrement, onDecrement } : PropTypes) => (
	<div className={styles.counter}>
		<span className={styles.title}>Counter: </span>
		<span className={styles.value}>{counter}</span>

		<button
			type="button"
			className={classNames('btn', 'btn-secondary', styles.button)}
			onClick={onIncrement}
		>
			Increment
		</button>

		<button
			type="button"
			className={classNames('btn', 'btn-secondary', styles.button)}
			onClick={onDecrement}
		>
			Decrement
		</button>
	</div>
)

Counter.propTypes = propTypes
Counter.defaultProps = defaultProps

export default connect(mapStateToProps)(Counter)
