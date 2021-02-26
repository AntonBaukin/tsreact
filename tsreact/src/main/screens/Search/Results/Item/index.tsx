import { useCallback } from 'react'
import classNames from 'classnames'
import { PropTypes, propTypes, defaultProps } from './props'
import Icon from 'src/components/Icon'
import styles from './styles.module.scss'

const Item = ({ index, record, onShowRecord }: PropTypes) => {
	const onClick = useCallback(
		() => onShowRecord(record.id),
		[record.id, onShowRecord]
	)

	return (
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

			<div className={styles.showRecord}>
				<button
					type="button"
					className="btn btn-sm btn-outline-dark"
					onClick={onClick}
				>
					<Icon name="eye"/>
				</button>

			</div>
		</div>
	)
}

Item.propTypes = propTypes
Item.defaultProps = defaultProps

export default Item
