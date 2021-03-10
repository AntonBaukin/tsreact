import get from 'lodash/get'
import { string, object, func } from 'prop-types'
import { createSelector } from 'reselect'
import { SearchPage, SearchRecord, FullRecord } from 'src/main/data/npi/domain'
import navigate from 'src/core/data/app/Navigate'
import doSearch from 'src/main/data/npi/DoSearch'
import fetchRecord from 'src/main/data/npi/FetchRecord'

export const propTypes = {
	id: string,
	record: object,
	onFetchRecord: func.isRequired,
	onGoBack: func.isRequired,
} as const

export interface PropTypes {
	id?: string
	record?: FullRecord
	onFetchRecord: (id: string) => void
	onGoBack: () => void,
}

export const defaultProps = {
	onFetchRecord: fetchRecord.curried,
	onGoBack: navigate.pop,
} as const

export const mapStateToProps = createSelector(
	(state: any, props: any) => props,
	doSearch.selectPage,
	fetchRecord.selectRecords,
	(props, page, records) => {
		const id = get(props, 'match.params.id')
		let record: FullRecord | undefined

		if (typeof id !== 'string') {
			return {}
		}

		//~: find the record within the loaded ones
		record = records.find(r => r.id === id)

		//?: { not found } lookup in the search results
		if (!record && page) {
			const sr = page.records.find(r => r.id === id)
			if (sr) {
				record = sr as FullRecord
			}
		}

		return { id, record }
	},
)
