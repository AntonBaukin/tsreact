import classNames from 'classnames'
import { PropTypes, propTypes, defaultProps } from './props'
import styles from './styles.module.scss'

const Item = ({ index, record }: PropTypes) => (
	<div
		className={classNames({
			[styles.searchRecord]: true,
			[styles.even]: index % 2 === 0,
			[styles.odd]: index % 2 === 1,
		})}
	>
		<div className={styles.type}>{record.type}</div>
		<div className={styles.name}>{record.name}</div>
		<div className={styles.address}>{record.address}</div>
	</div>
)

Item.propTypes = propTypes
Item.defaultProps = defaultProps

export default Item
