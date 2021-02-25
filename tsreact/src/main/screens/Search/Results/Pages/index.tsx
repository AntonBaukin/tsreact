import { useCallback } from 'react'
import ReactPaginate from 'react-paginate'
import { PropTypes, propTypes, defaultProps } from './props'
import styles from './styles.module.scss'

const Pages = ({ page, onSetPage }: PropTypes) => {
	const { size, records: { length } } = page
	const count = Math.floor(length / size) + (length % size === 0 ? 0 : 1)

	if (count === 0) {
		return null
	}

	const onPageChange = useCallback(
		({ selected }: { selected: number }) => onSetPage(selected),
		[onSetPage]
	)

	return (
		<ReactPaginate
			pageCount={count}
			pageRangeDisplayed={4}
			marginPagesDisplayed={1}
			disableInitialCallback
			previousLabel={null}
			previousClassName={styles.previous}
			nextLabel={null}
			nextClassName={styles.next}
			pageClassName={styles.page}
			activeClassName={styles.active}
			pageLinkClassName={styles.link}
			containerClassName={styles.pages}
			breakClassName={styles.page}
			forcePage={page.index}
			onPageChange={onPageChange}
		/>
	)
}

Pages.propTypes = propTypes
Pages.defaultProps = defaultProps

export default Pages
