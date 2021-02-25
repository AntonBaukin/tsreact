
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
}

/**
 * NPI database record.
 */
export interface Record
{
	id: string
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
	records: Record[]

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
} as NpiDomain
