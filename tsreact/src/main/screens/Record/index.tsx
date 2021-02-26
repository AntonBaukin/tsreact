import { connect } from 'react-redux'
import classNames from 'classnames'
import Scrollbars from 'src/components/Scrollbars'
import { PropTypes, propTypes, defaultProps, mapStateToProps } from './props'
import styles from './styles.module.scss'

const Record = (props: any) => {
	const { record } = props as PropTypes

	if (!record) {
		return null
	}

	return (
		<div className={styles.record}>
			{Object.entries(record).map(([key, value], index) => (
				<div
					key={key}
					className={classNames({
						[styles.field]: true,
						[styles.even]: index % 2 === 0,
						[styles.odd]: index % 2 === 1,
					})}
				>
					{value}
				</div>
			))}
		</div>
	)
}

Record.propTypes = propTypes
Record.defaultProps = defaultProps

export default connect(mapStateToProps)(Record)
