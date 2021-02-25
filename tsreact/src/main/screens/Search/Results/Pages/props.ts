import { object, func } from 'prop-types'
import { SearchPage } from 'src/main/data/npi/domain'
import setPage from 'src/main/data/npi/SetPage'

export const propTypes = {
	page: object.isRequired,
	onSetPage: func.isRequired,
} as const

export interface PropTypes {
	page: SearchPage,
	onSetPage: (index: number) => void,
}

export const defaultProps = {
	onSetPage: setPage.curried,
} as const
