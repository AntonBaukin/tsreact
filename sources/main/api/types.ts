import { Slice, Sorted } from '../../../sample/api'
import { PersonsSortOrder } from '../../../sample/db_users.api'

export * from '../../../sample/api'
export * from '../../../sample/db_users.api'

export type QueryRange<SortBy> = Required<Sorted<SortBy>> & Required<Slice>

export type PersonsQueryRange = QueryRange<PersonsSortOrder>
