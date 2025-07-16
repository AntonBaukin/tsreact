import { expectTrue, expectNever } from 'sources/asserts'
import { isNil, noop } from 'sources/lodash'
import { Abort, Fetch, Fetcher, FetcherHOF, QoS, Request, Response } from './types'

export interface QoSConfig {
  // Default timeout for a request. Note, that zero timeout,
  // to wait infinitely, is replaced with the default one.
  timeout: number,
  // Default timeout for QoS.REQ to replace [timeout] option:
  tmQoSReq?: number,
  // Default number of retry attempts:
  retries: number,
  // Default number of retry attempts for QoS.REQ to replace [retries] option:
  rtQoSReq?: number,
  // Default error status:
  errorStatus?: number, // * = 503
  // Retries allowed only for this statuses:
  retryStatuses?: number[],
  // Retries are always forbidden for this statuses:
  offStatuses?: number[],
  //
  // ...
  //
}

export type QoSFallback = (
  request: Request,
  error: unknown,
  fetch: Readonly<Fetch>,
  setAbort: (abort: Abort) => void,
) => Promise<Response>

export type QoSFallbackMaker = (config: QoSConfig) => (fetcher: Fetcher) => QoSFallback

/**
 * HOF to wrap a Fetcher to support QoS variants for the application.
 */
export const qosFetcher = (
  config: QoSConfig,
  makeFallback: QoSFallbackMaker = qosFallbackWithBackoff(),
): FetcherHOF => {
  const { timeout, tmQoSReq } = config

  expectTrue(timeout > 0)
  expectTrue(isNil(tmQoSReq) || tmQoSReq > 0)

  const fallbackMaker = makeFallback(config)

  return (fetcher: Fetcher) => {
    const fallback = fallbackMaker(fetcher)

    return (request: Request, extId?: number) => {
      expectTrue(isNil(request.timeout) || request.timeout > 0)

      if (!request.qos) {
        request.qos = QoS.STD
      }

      if (!request.timeout) {
        request.timeout = timeout

        if (request.qos === QoS.REQ && tmQoSReq) {
          request.timeout = tmQoSReq
        }
      }

      const fetch = fetcher(request, extId)
      let { abort } = fetch

      if (request.qos === QoS.OFF) {
        return fetch
      }

      fetch.result = fetch.result
        .then((result) => {
          if (!result.success) {
            if (result.status === 0) {
              result.status = config.errorStatus ?? 503
            }

            if (isRetryStatus(config, result.status)) {
              // By raising error we go into retry attempts:
              expectNever() // !: ERROR
            }
          }

          return result
        })
        .catch(
          (error) => fallback(
            request,
            error,
            fetch,
            (a: Abort) => {
              abort = a
            },
          )
        )

      fetch.abort = (reason?: any) => {
        abort(reason)
      }

      return fetch
    }
  }
}

const isRetryStatus = (config: QoSConfig, status: number) => {
  expectTrue(status > 0)

  if (config.offStatuses?.includes(status)) {
    return false
  }

  if (config.retryStatuses) {
    return config.retryStatuses.includes(status)
  }

  return status >= 400 // client or server errors only
}

export interface Backoff {
  // Backoff delay in milliseconds in milliseconds.
  // Zero value cancels the request with current error.
  delay: number,
}

/**
 * Backoff algorithm to select the wait delay before a retry attempt.
 */
export type Backoffer = (
  // Array of previous results, stays the same instance.
  // Algorithm may alter the array (splice it).
  previous: Backoff[],
  retry: number,
  request: Request,
  config: QoSConfig,
) => Backoff

export interface QoSBackoffFeedback {
  // E — initial or following error
  // 0 — stop on zero backoff delay
  // B — next backoff selected
  // A — aborted
  // F — (repeated) fetch
  // ! — retry success (and exit)
  // S — failed with retry status
  // X — all retry repeats failed, exit
  kind: 'E' | '0' | 'B' | 'A' | 'F' | '!' | 'S' | 'X',
  id: number,
  request: Request,
  result?: Response,
  retry?: number,
  retries?: number,
  error?: unknown,
  // This event forces the cycle to break, or algorithm ends:
  final?: true,
  backoff?: Backoff,
  backoffs?: Backoff[],
}

export const qosFallbackWithBackoff = (
  backoffer: Backoffer = fibonacciBackoffer(),
  feedback?: (f: QoSBackoffFeedback) => void,
) => (config: QoSConfig) => (fetcher: Fetcher): QoSFallback => {
  expectTrue(config.retries >= 0)
  expectTrue(isNil(config.rtQoSReq) || config.rtQoSReq >= 0)

  return (
    request: Request,
    errorInitial: unknown,
    { id }: Readonly<Fetch>,
    setAbort: (abort: Abort) => void,
  ) => new Promise<Response>((resolve, reject) => {
    let innerReject: (() => void) = noop
    let aborted = false

    const abort: Abort = (reason) => {
      aborted = true
      reject(reason)
      innerReject()
      feedback?.({ kind: 'A', id, request })
    }

    const resolver = async () => {
      let retry = 1
      let error = errorInitial
      let retries = config.retries
      const backoffs: Backoff[] = []

      const fb = !feedback ? null :
        (kind: QoSBackoffFeedback['kind'], data: Partial<QoSBackoffFeedback> = {}) => {
          const f: QoSBackoffFeedback = { kind, id, request, retry, retries, ...data }

          if (data.backoff) {
            f.backoffs = backoffs
          }

          feedback(f)
        }

      if (request.qos === QoS.REQ && !isNil(config.rtQoSReq)) {
        retries = config.rtQoSReq
      }

      fb?.('E', { error })

      while (!aborted && retries > 0) {
        const backoff = backoffer(backoffs, retry, request, config)

        if (backoff.delay <= 0) {
          feedback?.({
            kind: '0',
            id,
            request,
            retry,
            retries,
            final: true,
            backoff,
            backoffs,
          })
          break     //!: EXIT
        } else {
          retry++
          retries--
          fb?.('B', { backoff })
          backoffs.push(backoff)
        }

        // Do wait the backoff delay with cancellation:
        try {
          await new Promise<void>((tmResolve, tmReject) => {
            const tmHandle = setTimeout(tmResolve, backoff.delay)

            innerReject = () => {
              clearTimeout(tmHandle)
              tmReject() // => await exception
            }
          })
        } catch (e: unknown) {
          fb?.('A', { final: true, error: e })
          break     //!: EXIT
        }

        let result: Response
        fb?.('F')

        // Assign current retry index 1..
        request.retry = retry

        try {
          // Reuse the same id for the same request repeated:
          const fetch = fetcher(request, id)

          innerReject = () => {
            fetch.abort()
          }

          result = await fetch.result
        } catch (e) {
          result = errorAsResponse(config, e)
        }

        if (result.error) {
          result.success = false
          error = result.error
          fb?.('E', { error })
        }

        if (result.status === 0) {
          result.status = result.success ? 200 : (config.errorStatus ?? 503)
        } else {
          expectTrue(result.status > 0)
        }

        if (result.success) {
          fb?.('!', { result })
          return result   //!: RETURN
        }

        if (!isRetryStatus(config, result.status)) {
          fb?.('S', { result })
          break           //!: EXIT
        }
      }

      // Return the result with the last error available:
      fb?.('X', { error })
      return errorAsResponse(config, error)
    }

    setAbort(abort)
    resolve(resolver())
  })
}

const errorAsResponse = (config: QoSConfig, error: unknown): Response => ({
  success: false,
  status: config.errorStatus ?? 503,
  error,
  doneAt: Date.now(),
  headers: {},
  body: { type: 'null' },
})

export type QosDelays = Record<QoS, number>

export const qosDelays = (req: number, std: number): QosDelays => ({
  [QoS.REQ]: req,
  [QoS.STD]: std,
  [QoS.OFF]: 0,
})

export type FibonacciSum = (
  a: number,
  b: number,
  retry: number,
  request: Request,
  config: QoSConfig,
) => number

/**
 * The next delay is the sum of two previous. The defaults delays are:
 *  QoS.REQ — 0.3s, 0.8s, 1.1s, 1.9s, ...
 *  QoS.STD — 1.0s, 2.5s, 3.5s, 6.0s, ...
 */
export const fibonacciBackoffer = (    // REQ    STD
  firstDelay = qosDelays(300, 1000),   // 500ms, 1s
  secondDelay = qosDelays(500, 1500), // 1s,    1.5s
  // Here you can alternate the sequence flow, or break it by returning 0:
  sum: FibonacciSum = ((a: number, b: number) => a + b),
): Backoffer => (
  previous: Backoff[],
  retry: number,
  request: Request,
  config: QoSConfig,
) => {
  const { length } = previous
  let delay: number

  if (length === 0) {
    delay = firstDelay[request.qos ?? QoS.STD]
  } else if (length === 1) {
    delay = sum (
      previous[0].delay,
      secondDelay[request.qos ?? QoS.STD],
      retry,
      request,
      config,
    )
  } else {
    delay = sum (
      previous[length - 2].delay,
      previous[length - 1].delay,
      retry,
      request,
      config,
    )

    // Remove all the items, but the last one — note that the item
    // to return will be added to the previous array:
    previous.splice(0, length - 1)
  }

  return { delay }
}
