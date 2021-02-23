import { useCallback } from 'react'
import classNames from 'classnames'
import Scrollbars from 'src/components/Scrollbars'
import SearchInput from 'src/components/forms/SearchInput'
import styles from './styles.module.scss'

const Search = () => {
	const doSearch = useCallback(
		(value) => console.log('Search!', value),
		[]
	)

	return (
		<div className={styles.search}>
			<Scrollbars className={styles.scroll}>
				<div className={styles.inputBlock}>
					<SearchInput
						id="main-search-input"
						onSearch={doSearch}
					/>
				</div>
			</Scrollbars>
		</div>
	)
}

export default Search
