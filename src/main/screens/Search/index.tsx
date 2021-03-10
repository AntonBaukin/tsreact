import { connect } from 'react-redux'
import classNames from 'classnames'
import Scrollbars from 'src/components/Scrollbars'
import SearchInput from 'src/components/forms/SearchInput'
import doSearch from 'src/main/data/npi/DoSearch'
import { PropTypes, propTypes, defaultProps, mapStateToProps } from './props'
import Results from './Results'
import styles from './styles.module.scss'

const Search = (props: any) => {
	const { searchText } = props as PropTypes

	return (
		<div className={styles.search}>
			<Scrollbars className={styles.scroll}>
				<div className={styles.inputBlock}>
					<SearchInput
						id="main-search-input"
						initialValue={searchText}
						onSearch={doSearch.curried}
					/>
				</div>

				<Results />
			</Scrollbars>
		</div>
	)
}

Search.propTypes = propTypes
Search.defaultProps = defaultProps

export default connect(mapStateToProps)(Search)
