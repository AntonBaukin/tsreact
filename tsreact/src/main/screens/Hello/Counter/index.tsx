import { connect } from 'react-redux'
import classNames from 'classnames'
import Text, { text } from 'src/components/Text'
import { PropTypes, propTypes, defaultProps, mapStateToProps } from './props'
import styles from './styles.module.scss'

const Counter = ({ counter, onIncrement, onDecrement } : PropTypes) => (
	<div className={styles.counter}>
		<span className={styles.title}>
			<Text>COUNTER</Text>
		</span>
		<span className={styles.value}>
			<Text value={counter}>COUNTER_VALUE</Text>
		</span>

		<button
			type="button"
			className={classNames('btn', 'btn-secondary', styles.button)}
			title={text('INCREMENT_BY', { value: 1 })}
			onClick={onIncrement}
		>
			<Text>INCREMENT</Text>
		</button>

		<button
			type="button"
			className={classNames('btn', 'btn-secondary', styles.button)}
			title={text('DECREMENT_BY', { value: 1 })}
			onClick={onDecrement}
		>
			<Text>DECREMENT</Text>
		</button>
	</div>
)

Counter.propTypes = propTypes
Counter.defaultProps = defaultProps

export default connect(mapStateToProps)(Counter)
