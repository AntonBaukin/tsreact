import { number, object } from 'prop-types'
import { SearchRecord } from 'src/main/data/npi/domain'

export const propTypes = {
	index: number,
	record: object,
} as const

export interface PropTypes {
	index: number,
	record: SearchRecord,
}

export const defaultProps = {
} as const
