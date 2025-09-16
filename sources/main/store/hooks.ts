import { useMemo } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { isString } from 'sources/lodash'
import { DispatchBase, StateBase } from 'sources/app'
import { FetchUnit } from 'sources/fetch'
import { Payload } from 'sources/unit'
import { DataSlice, QueryAndBody, QueryRange } from 'sources/main/api/types'
import { AppDispatch } from './create'
import { AppState } from './slices'

export const useAppDispatch = useDispatch.withTypes<AppDispatch>()

export const useAppSelector = useSelector.withTypes<AppState>()

export const useSelectDataRange = <
  SortBy,
  Q extends QueryRange<SortBy>,
  B extends {},
  D,
  X,
  // @ts-expect-error: Payload Vs Any
> (unit: FetchUnit<AppState, AppDispatch, D[], [QueryAndBody<Q, B>], X>): DataSlice<D> => {
  const {
    isLoading,
    data,
    headers,
    args,
  } = useAppSelector(unit.selectFetched)

  const [qb] = args ?? []
  const total = headers?.['x-total-count']

  return useMemo(() => ({
    isLoading,
    offset: qb?.query?.offset ?? 0,
    limit: qb?.query?.limit ?? 0,
    total: isString(total) ? Number(total) : 0,
    data: data ?? [],
  }), [
    isLoading,
    qb?.query?.offset,
    qb?.query?.limit,
    total,
  ])
}
