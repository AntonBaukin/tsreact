import classNames from 'classnames'
import Scrollbars from 'src/components/Scrollbars'
import SearchInput from 'src/components/forms/SearchInput'
import doSearch from 'src/main/data/npi/DoSearch'
import styles from './styles.module.scss'

const Search = () => {
	return (
		<div className={styles.search}>
			<Scrollbars className={styles.scroll}>
				<div className={styles.inputBlock}>
					<SearchInput
						id="main-search-input"
						onSearch={doSearch.carried}
					/>
				</div>
			</Scrollbars>
		</div>
	)
}

export default Search
