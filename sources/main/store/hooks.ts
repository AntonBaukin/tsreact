import { useMemo, useCallback, useState, useRef } from 'react'
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

export const useAccumulateData = <D, A extends any[], R = void> (
  { isLoading, data, offset, limit }: DataSlice<D>,
  fetch: (offset: number, limit: number) => void,
  render: (item: D, ...args: A) => R | undefined,
) => {
  const [indexMap] = useState(new Map<number, D | undefined>())

  if (!isLoading && data && offset >= 0) {
    for (let i = 0; i < data.length; i++) {
      indexMap.set(offset + i, data[i])
    }
  }

  const getAt = useCallback((i: number) => indexMap.get(i), [])

  const renderRef = useRef(render)
  renderRef.current = render

  const renderAt = useCallback((i: number, ...args: A): R | undefined => {
    const item = indexMap.get(i)
    return item ? render(item, ...args) : undefined
  }, [])

  const windowFetcher = useCallback((offset: number, window: number) => {
    let fetchAt = offset + window

    while (fetchAt > offset) {
      if (indexMap.get(fetchAt)) {
        fetchAt++
        break
      } else {
        fetchAt--
      }
    }

    if (!indexMap.get(fetchAt)) {
      fetch(fetchAt, limit)
    }
  }, [])

  return { getAt, renderAt, windowFetcher }
}
