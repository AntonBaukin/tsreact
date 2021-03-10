import { createSelector } from 'reselect'
import { string } from 'prop-types'
import doSearch from 'src/main/data/npi/DoSearch'

export const propTypes = {
	searchText: string.isRequired,
} as const

export interface PropTypes {
	searchText: string,
}

export const defaultProps = {
} as const

export const mapStateToProps = createSelector(
	doSearch.selectSearchText,
	(searchText) => ({ searchText }),
)
