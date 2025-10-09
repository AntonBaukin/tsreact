import { useMemo, useCallback, useState, useRef } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { iRange, isString } from 'sources/lodash'
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
  const totalRef = useRef(0)
  const totalStr = headers?.['x-total-count']

  if (isString(totalStr)) {
    const total = Number(totalStr)

    // Do not reset total to zero while loading:
    if (Number.isInteger(total) && total > 0) {
      totalRef.current = total
    }
  }

  return useMemo(() => ({
    isLoading,
    offset: qb?.query?.offset ?? 0,
    limit: qb?.query?.limit ?? 0,
    total: totalRef.current,
    data: data ?? [],
  }), [
    isLoading,
    qb?.query?.offset,
    qb?.query?.limit,
    totalRef.current,
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
  options?: { total?: number, debounce?: number, minLimit?: number },
) => {
  const { total, debounce = 32 * 8, minLimit = 0 } = options ?? {}

  const getAt = useCallback((i: number) => accumUnit.indexMap.get(i), [])

  const renderRef = useRef(render)
  renderRef.current = render

  const renderAt = useCallback((i: number, ...args: A): R | undefined => {
    const item = accumUnit.indexMap.get(i)
    return item ? render(item, ...args) : undefined
  }, [])

  // Requested fetches:
  type FetchAt = { begin: number, end: number }
  const [fetchAt, setFetchAt] = useState<FetchAt[]>([{ begin: 0, end: 1 }])
  const windowRef = useRef(1)

  // Cache of indexes of requested positions:
  const [pendingAts] = useState(new Set<number>())

  useEffectDebounce(debounce, () => {
    const indexMap = accumUnit.indexMap

    // Yes, we update the same array instance:
    const fetchAtLocal = fetchAt.splice(0, fetchAt.length)

    if (!fetchAtLocal.length) {
      return
    }

    const window = Math.max(
      windowRef.current,
      ...fetchAtLocal.map(fAt => fAt.end - fAt.begin),
    )

    if (window > windowRef.current) {
      windowRef.current = window
    }

    let begin = Math.min(...fetchAtLocal.map(fAt => fAt.begin))
    let end = Math.max(...fetchAtLocal.map(fAt => fAt.end))

    const gotIt = (i: number) => {
      if (indexMap.get(i)) {
        pendingAts.delete(i) //<-- side-effect
        return true
      } else {
        return false
      }
    }

    while (begin < end) {
      if (gotIt(begin)) {
        begin++
      } else {
        break
      }
    }

    while (begin < end) {
      if (gotIt(end - 1)) {
        end--
      } else {
        break
      }
    }

    if (begin >= end || (total && begin >= total)) {
      return
    }

    end = Math.max(end, begin + Math.max(window, minLimit))

    // Mark requested items as pending:
    iRange(begin, end).forEach(i => pendingAts.add(i))

    // Do the actual fetch:
    fetch(begin, end - begin)
  }, [fetchAt])

  const windowFetcher = useCallback((offset: number, window: number) => {
    setFetchAt(fa => [...fa, { begin: offset, end: offset + window }])
  }, [])

  return { getAt, renderAt, windowFetcher }
}
