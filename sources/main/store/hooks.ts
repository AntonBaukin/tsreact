import { useMemo, useCallback, useState, useRef } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { isString } from 'sources/lodash'
import { useEffectDebounce } from 'sources/co/hooks'
import { AccumExtractor, AccumUnit, FetchUnit, FetchUnitSlice } from 'sources/fetch'
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

export const makeAccumExtractor = <D>(): AccumExtractor<D> => (p: unknown) => {
  const { data, args } = p as FetchUnitSlice<D[], any[], any>

  if (Array.isArray(data)) {
    const { query } = args?.[0] as QueryAndBody<QueryRange<any>, any>
    const { offset } = query ?? {}

    if (Number.isFinite(offset)) {
      return { data, offset }
    }
  }

  return { data: undefined, offset: 0 }
}

export const useAccumulateData = <D, A extends any[], R = void> (
  accumUnit: AccumUnit<AppState, AppDispatch, D>,
  fetch: (offset: number, limit: number) => void,
  render: (item: D, ...args: A) => R | undefined,
  debounce = 200,
) => {

  const getAt = useCallback((i: number) => accumUnit.indexMap.get(i), [])

  const renderRef = useRef(render)
  renderRef.current = render

  const renderAt = useCallback((i: number, ...args: A): R | undefined => {
    const item = accumUnit.indexMap.get(i)
    return item ? render(item, ...args) : undefined
  }, [])

  type FetchAt = { offset: number, window: number }
  const [fetchAt, setFetchAt] = useState<FetchAt>({ offset: 0, window: 1 })
  const borderRef = useRef(0)

  useEffectDebounce(debounce, () => {
    const indexMap = accumUnit.indexMap
    const { offset, window } = fetchAt

    let fAt = offset + window

    while (fAt > offset) {
      if (indexMap.get(fAt)) {
        fAt++
        break
      } else {
        fAt--
      }
    }

    if (indexMap.get(fAt)) {
      return
    }

    const border = borderRef.current
    if (fAt > border) {
      borderRef.current = fAt + window + 1
      fetch(fAt, window)
    }

  }, [fetchAt.offset, fetchAt.window])

  const windowFetcher = useCallback((offset: number, window: number) => {
    setFetchAt({ offset, window })
  }, [])

  return { getAt, renderAt, windowFetcher }
}
