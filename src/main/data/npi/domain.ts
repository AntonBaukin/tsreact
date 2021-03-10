
/**
 * Domain name for NPI data units.
 */
export const NPI = 'npi'

export interface NpiDomain
{
	/**
	 * Do search by this text.
	 */
	searchText: string

	/**
	 * Parameters of the pending query.
	 */
	searchParams?: SearchParams

	/**
	 * Loaded data. When search text alters, page is removed.
	 */
	page?: SearchPage

	/**
	 * Full records loaded individually.
	 */
	records: FullRecord[]
}

/**
 * Record of plain search in NPI database.
 */
export interface SearchRecord
{
	id: string
	type: string
	name: string
	address: string
}

export interface FullRecord extends SearchRecord
{
	gender: string
	country: string
	state: string
	city: string
	phone: string
}

/**
 * In some places of the UI search record is temporary used
 * instead of the full one. This simply checks.
 */
export const isFullRecord = (record: SearchRecord | FullRecord) => (
	Object.keys(record).length > 4
)

export interface SearchResults
{
	total: number,
	records: SearchRecord[]
}

/**
 * Parameters of a search query.
 */
export interface SearchParams
{
	terms: string
	maxList: number
}

export interface SearchPage
{
	/**
	 * Total number of the records found.
	 */
	total: number

	/**
	 * Limit used to load the data.
	 * Records array stores all the data till this limit.
	 * You may load more data if total > limit and
	 * records.length = limit.
	 */
	limit: number

	/**
	 * Page size. It's a configured constant.
	 * (Use it to calculate the pages number.)
	 */
	size: number

	/**
	 * Current page, starts with 0.
	 */
	index: number

	/**
	 * Loaded records.
	 */
	records: SearchRecord[]

	/**
	 * Parameters used to fetch the data.
	 */
	params: SearchParams
}


/**
 * Initial state of every reducing data unit from NPI domain.
 * (The first who does the reduce installs it.)
 */
export const initialState = {
	searchText: '',
	records: [],
} as NpiDomain
