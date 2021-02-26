import { number, object, func } from 'prop-types'
import { SearchRecord } from 'src/main/data/npi/domain'
import goToRecord from 'src/main/data/npi/GoToRecord'

export const propTypes = {
	index: number,
	record: object,
	onShowRecord: func,
} as const

export interface PropTypes {
	index: number,
	record: SearchRecord,
	onShowRecord: (id: string) => void,
}

export const defaultProps = {
	onShowRecord: goToRecord.curried,
} as const
