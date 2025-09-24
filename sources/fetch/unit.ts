import { isEqual, isNil } from 'sources/lodash'
import { AppContext, DispatchBase, StateBase } from 'sources/app'
import {
  UnitUtilities,
  DefineOwnUnitUtility,
  Payload,
  DefineOnlyUnitUtility, DataUnit,
} from 'sources/unit'
import { Abort, DataSource, Headers } from './types'

export type FetchUnitSlice<D, A extends any[], X> = {
  // The pending request arguments:
  args: A | null,
  // The data stored in Redux:
  data: D | null,
  // Whether there is a fetch pending:
  isLoading: boolean,
  // Actual fetch index (incremented request id, initial 0):
  index: number,
  // After the load, reports the status:
  success: boolean | null,
  // Payload-like data of an error | abortion:
  error: X | null,
  // The HTTP response headers (both, succeed or failed):
  headers: Headers | null,
  // Payload only, reporting obsolete data:
  obsolete?: boolean,
}

// Invoked for still actual request to produce Redux-compatible data:
export type OnFetchError<X extends Payload> =
  (error: unknown, abortReason: any) => X | null | undefined | void

export interface FetchUnitOptions<X extends Payload> {
  onError?: OnFetchError<X>,
  aborting?: boolean, // * = false
}

/**
 * The root unit created owns Redux data slice of type FetchUnitSlice.
 */
const makeFetchUnitImpl = <
  S extends StateBase,
  G extends DispatchBase,
  // Payload-like data instance (object or array of objects):
  D extends Payload,
  // Data Source arguments, i.e. the fetch request parameters,
  // they all MUST be Payload-like (POJOs):
  A extends any[],
  X extends Payload = Payload,
> (
  appContext: AppContext<S, G>,
  defineOwnUnit: DefineOwnUnitUtility<S, G>,
  dataSource: DataSource<D, A>,
  // Name of the root Data Unit — reports fetched data, owns the data slice:
  name: string,
  options?: FetchUnitOptions<X>,
) => {
  type LocalSlice = FetchUnitSlice<D, A, X>

  // We simply update all the state each time:
  type UnitPayload = LocalSlice

  // Incremented on each request issued:
  let index = 0

  const initialState: (() => LocalSlice) = () => ({
    args: null,
    data: null,
    isLoading: false,
    index,
    success: null,
    error: null,
    headers: null,
  })

  const selectFetched = (state: LocalSlice) => state

  const unitBase = defineOwnUnit({
    name,

    initialState,

    reduceOwn(state: LocalSlice, payload: UnitPayload | null) {
      if (!payload?.obsolete) {
        Object.assign(state, isNil(payload) ? initialState() : payload)
      }
    },
  })

  const unit = unitBase
    .dispatchSelf({ fetch })
    .select({ selectFetched })
    .dataUnit

  // Abort functions of all the pending requests:
  const aborters: Abort[] = []

  const abortAll = (reason: UnitPayload) => {
    // Abort all the pending requests:
    aborters.forEach(a => {
      try {
        a(reason)
      } catch (_ignore: unknown) {
      }
    })

    // ... and clear the aborters:
    aborters.splice(0, aborters.length)
  }

  const abortOff = (a: Abort) => {
    const i = aborters.indexOf(a)

    if (i >= 0) {
      aborters.splice(i, 1)
    }
  }

  const errorPayload = (e: unknown, abortReason: any): UnitPayload => {
    let error: X | null = null

    if (options?.onError) {
      const x = options.onError(e, abortReason)

      if (!isNil(x) && x !== undefined) {
        error = x
      }
    }

    return {
      ...initialState(),
      success: false,
      error,
    }
  }

  async function fetch(...args: A) {
    const zeroState: LocalSlice = unit.selectFetched(appContext.state)

    // {The same request is currently pending?}
    if (isEqual(zeroState.args, args)) {
      return // Do not repeat the same request
    }

    const nextIndex = ++index

    const isRequestObsolete = () => {
      const nowState: LocalSlice = unit.selectFetched(appContext.state)
      return nowState.index !== nextIndex
    }

    const resetPayload: UnitPayload = {
      ...initialState(),
      isLoading: true,
      args,
    }

    // Reset the present data now (side-effect!):
    unit.dispatch(unit, resetPayload)

    // Abort all now obsolete requests:
    if (options?.aborting) {
      abortAll(resetPayload)
    }

    // Fetch the data
    const { result: pendingResult, abort } = dataSource(...args)

    // Register current aborter:
    aborters.push(abort)

    // Wait for the results:
    try {
      const result = await pendingResult
      const obsolete = isRequestObsolete()

      // Check this request is still actual:
      if(obsolete && options?.aborting) {
        return
      }

      if (result.success) {
        return {
          ...resetPayload,
          isLoading: false,
          success: true,
          obsolete,
          headers: { ...result.headers },
          data: result.data,
        }
      } else {
        return errorPayload(result.error, result.aborted)
      }
    } catch (e: unknown) {
      // Check this request is still actual:
      if(isRequestObsolete()) {
        return
      }

      return errorPayload(e, undefined)
    } finally {
      // Unregister current aborter:
      abortOff(abort)
    }
  }

  return unit
}

export const makeFetchUnit = makeFetchUnitImpl

export type FetchUnit <
  S extends StateBase,
  G extends DispatchBase,
  D extends Payload,
  A extends any[],
  X extends Payload = Payload,
> = ReturnType<typeof makeFetchUnit<S, G, D, A, X>>

export interface AccumData<D> {
  data: (D | undefined)[] | undefined,
  offset: number,
}

export type AccumExtractor<D> =
  (payload: unknown, type: string, unit?: DataUnit) => AccumData<D>

/**
 * Acts on fetch results of ranged queries, and maps the index
 * corresponding to the data offset to the entities.
 *
 * Warning. This unit works as the data cache.
 * It doesn't store anything in Redux!
 *
 * The unit has 'indexMap' Map: index => optional entity.
 * Hint: there may be holes in the data.
 */
const makeAccumUnitImpl = <
  S extends StateBase,
  G extends DispatchBase,
  D,
> (
  appContext: AppContext<S, G>,
  defineOnlyUnit: DefineOnlyUnitUtility<S, G>,
  name: string,
  actsOnFetch: string | DataUnit | Array<string | DataUnit>,
  extractor: AccumExtractor<D>,
) => {
  const indexMap = new Map<number, D | undefined>()

  const actsOn = () => Array.isArray(actsOnFetch) ? actsOnFetch : [actsOnFetch]

  const trigger = (type: string, payload: unknown, unit?: DataUnit) => {
    const { data, offset } = extractor(payload, type, unit)

    if (data && offset >= 0) {
      for (let i = 0; i < data.length; i++) {
        indexMap.set(offset + i, data[i])
      }
    }
  }

  return defineOnlyUnit({ name, actsOn, trigger, indexMap }).dataUnit
}

export const makeAccumUnit = makeAccumUnitImpl

export type AccumUnit <
  S extends StateBase,
  G extends DispatchBase,
  D,
> = ReturnType<typeof makeAccumUnit<S, G, D>>

export const fetchUnitUnitilties = <
  S extends StateBase,
  G extends DispatchBase = DispatchBase
> (
  appContext: AppContext<S, G>,
  { defineOnlyUnit, defineOwnUnit }: UnitUtilities<S, G>,
) => {
  const makeFetchUnit = <
    D extends any,
    A extends any[],
    X extends Payload = Payload
  > (
    name: string,
    dataSource: DataSource<D, A>,
    options?: FetchUnitOptions<X>,
    // @ts-expect-error: Payload Vs Any
  ): FetchUnit<S, G, D, A, X> => makeFetchUnitImpl (
    appContext,
    defineOwnUnit,
    // @ts-expect-error: Payload Vs Any
    dataSource,
    name,
    options,
  )

  const makeAccumUnit = <D extends any > (
    name: string,
    actsOnFetch: string | DataUnit | Array<string | DataUnit>,
    extractor: AccumExtractor<D>,
  ): AccumUnit<S, G, D> => makeAccumUnitImpl (
    appContext,
    defineOnlyUnit,
    name,
    actsOnFetch,
    extractor,
  )

  return { makeFetchUnit, makeAccumUnit }
}
