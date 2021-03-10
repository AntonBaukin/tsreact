import { object } from 'prop-types'
import { createSelector } from 'reselect'
import { SearchPage } from 'src/main/data/npi/domain'
import doSearch from 'src/main/data/npi/DoSearch'

export const propTypes = {
	page: object,
} as const

export interface PropTypes {
	page?: SearchPage,
}

export const defaultProps = {
} as const

export const mapStateToProps = createSelector(
	doSearch.selectPage,
	(page) => ({ page }),
)
