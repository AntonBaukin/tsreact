
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
 * Record of plain search in NPI database.
 */
export interface SearchRecord
{
	id: string,
	type: string,
	name: string,
	address: string,
}

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

	page: JSON.parse('{"total":50000,"limit":20,"size":10,"index":0,"params":{"terms":"nurse","maxList":20},"records":[{"id":"1215397187","type":"Nurse Practitioner","name":"NURSE, MARILYN","address":"3820 BRIARCLIFF RD NE, ATLANTA, GA 30345"},{"id":"1215259015","type":"Licensed Practical Nurse","name":"NURSE, TSAHAY","address":"189 E 18TH ST APT 3B, BROOKLYN, NY 11226"},{"id":"1972953719","type":"Nurse Practitioner","name":"ARTHUR-NURSE, EDLYN","address":"880 RIVER RD, NEW MILFORD, NJ 07646"},{"id":"1295057040","type":"Licensed Practical Nurse","name":"RENNIE-NURSE, PHYLLIS","address":"16937 144TH RD, JAMAICA, NY 11434"},{"id":"1265567473","type":"Nurse Practitioner","name":"KOHLERMAN, NANCY","address":"2520 W BUTLER DR FAMILY NURSE PRACTITIONER, PHOENIX, AZ 85021"},{"id":"1023509965","type":"Nurse Practitioner","name":"PIERCE, JUDITH","address":"1536 NURSERY RD, CLEARWATER, FL 33756"},{"id":"1578966420","type":"Nurse Practitioner","name":"TOURTILLOTT, MISTY","address":"617 W NURSERY ST, BUTLER, MO 64730"},{"id":"1144429911","type":"Nurse Practitioner","name":"SCHMALTZ, GALE","address":"2315 STOCKTON BLVD DAVIS 5, INTENSIVE CARE NURSERY, SACRAMENTO, CA 95817"},{"id":"1083063903","type":"Dentist","name":"SIMPSON, LAURA","address":"603 NURSERY RD, WESTMINSTER, MD 21157"},{"id":"1366996662","type":"Physical Therapist in Private Practice","name":"HEPPDING, ALYSSA","address":"1431 NURSERY ST, FOGELSVILLE, PA 18051"},{"id":"1679532030","type":"Dentist","name":"KLEIN, HARVEY","address":"603 NURSERY RD, WESTMINSTER, MD 21157"},{"id":"1922424498","type":"Specialist/Technologist","name":"EILBACHER, CRAIG","address":"840 BECKS NURSERY RD, LEXINGTON, NC 27292"},{"id":"1487063343","type":"Dentist","name":"BANSAL, ANKITA","address":"100 WOLFE NURSERY RD 190, STEPHENVILLE, TX 76401"},{"id":"1952968901","type":"Counselor","name":"WELDER, ELIZA","address":"6502 NURSERY DR. SUITE SUITE 100, VICTORIA, TX 77904"},{"id":"1639307242","type":"Physician/Pediatric Medicine","name":"MANUAT, CHARISSA","address":"350 W THOMAS RD 5TH FLOOR NURSERY ICU, ATTN: SHAWN SALEMME, PHOENIX, AZ 85013"},{"id":"1124203310","type":"Registered Nurse","name":"FLORENDO, CHRISTINE","address":"21419 W DOVE VALLEY RD, WITTMANN, AZ 85361"},{"id":"1477738680","type":"Registered Nurse","name":"MCDANIEL, MARY","address":"1250 S MANUFACTURERS ROW, TRENTON, TN 38382"},{"id":"1073798344","type":"Nurse Practitioner","name":"YOUNGQUIST, KAREN","address":"1284 N SUMMIT AVE, OCONOMOWOC, WI 53066"},{"id":"1548445729","type":"Nurse Practitioner","name":"LASPESA, LINDA","address":"6909 MLK ST S, ST PETERSBURG, FL 33705"},{"id":"1124203393","type":"Registered Nurse","name":"GUNN, PATTI","address":"6605 W CENTRAL AVE, TOLEDO, OH 43617"}]}') as SearchPage
} as NpiDomain
