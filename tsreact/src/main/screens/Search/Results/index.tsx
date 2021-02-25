import { connect } from 'react-redux'
import Text from 'src/components/Text'
import { PropTypes, propTypes, defaultProps, mapStateToProps } from './props'
import Pages from './Pages'
import Item from './Item'
import styles from './styles.module.scss'

const Results = (props: any) => {
	const { page } = props as PropTypes

	if (!page) {
		return null
	}

	const { total, index, size, records } = page
	const items = records.slice(index * size, (index + 1) * size)

	return (
		<div className={styles.searchResults}>
			<div className={styles.total}>
				<Text total={total}>SEARCH_TOTAL</Text>
			</div>

			<div className={styles.pages}>
				<Pages page={page} />
			</div>

			<div className={styles.items}>
				{items.map((record, index) => (
					<Item
						key={record.id}
						index={index}
						record={record}
					/>
				))}
			</div>

			<div className={styles.pages}>
				<Pages page={page} />
			</div>
		</div>
	)
}

Results.propTypes = propTypes
Results.defaultProps = defaultProps

export default connect(mapStateToProps)(Results)
