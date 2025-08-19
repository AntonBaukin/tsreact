export type Uuid = string

export interface Entity {
  uuid: Uuid,
}

export type SortOrder = 'asc' | 'desc'

export interface Sorted<SortBy> {
  sort?: SortBy,
  order?: SortOrder,
}

export type Offset = number

export type Limit = number

export interface Slice {
  offset?: Offset,
  limit?: Limit,
}

export type QueryRange<SortBy> = Required<Sorted<SortBy>> & Required<Slice>

export interface QueryAndBody<Q, B> {
  query: Q,
  body: B,
}

export type BodyRange<SortBy, Q extends QueryRange<SortBy>, B> = QueryAndBody<Q, B>

/**
 * Date in ISO format: 'YYYY-DD-MM'.
 */
export type Date = string

/**
 * Date and time in ISO format: 'YYYY-MM-DDTHH:mm:ss.SSSZ'.
 */
export type Timestamp = string

export type Email = string

export type Phone = string

/**
 * Two-letter country code, such as 'US', 'UK'.
 */
export type CountryCode = string
