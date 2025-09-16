export * from '../../../sample/api'
export * from '../../../sample/db_users.api'

export interface DataSlice<D> {
  isLoading: boolean,
  offset: number,
  limit: number,
  total: number,
  data: D[],
}
