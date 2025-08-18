import {
  Body,
  DataResult,
  DataSource, DataSuccess,
  Fetcher,
  Headers,
  isBodyJson,
  isBodyNull,
  isBodyText,
  QoS,
  Query,
  Request,
  symDataSource,
  Transform,
} from './types'

export const dataFetcher = <D, A extends any[]> (
  fetcher: Fetcher,
  transform: Transform<D>,
  makeRequest: (...args: A) => Request,
): DataSource<D, A> => {
  const dataSource = (...args: A) => {
    const request = makeRequest(...args)
    const fetch = fetcher(request)

    const result: Promise<DataResult<D>> = fetch
      .result
      .then(({ success, aborted, error, headers, body }) => {
        if (!success || aborted || error) {
          return {
            success: false,
            aborted,
            error,
            headers,
          } as const
        }

        let source = undefined

        if (isBodyNull(body)) {
          source = null
        } else if (isBodyText(body)) {
          source = body.text
        } else if (isBodyJson(body)) {
          source = body.json
        }

        try {
          const data = transform(source)

          return {
            success: true,
            data,
            headers,
          } as const
        } catch (trError: unknown) {
          return {
            success: false,
            error: trError,
            headers,
          } as const
        }
      })
      .catch((error) => {
        return {
          success: false,
          error,
          headers: {},
        } as const
      })

    return { result, abort: fetch.abort }
  }

  return Object.assign(
    dataSource,
    { dataSource: symDataSource },
  ) as DataSource<D, A>
}

export const dataGet = <D, A extends any[]> (
  fetcher: Fetcher,
  transform: Transform<D>,
  path: string,
  makeQuery?: (...args: A) => Query,
  makeOptions?: (...args: A) => {
    headers?: Headers,
    timeout?: number,
    qos?: QoS,
  },
) => dataFetcher<D, A>(
  fetcher,
  transform,
  (...args: A) => ({
    method: 'GET',
    path,
    query: makeQuery?.(...args),
    ...makeOptions?.(...args),
  }),
)

export const dataPost = <D, A extends any[]> (
  fetcher: Fetcher,
  transform: Transform<D>,
  path: string,
  makeBody: (...args: A) => Body,
  makeOptions?: (...args: A) => {
    query?: Query,
    headers?: Headers,
    timeout?: number,
    qos?: QoS,
  },
) => dataFetcher<D, A>(
  fetcher,
  transform,
  (...args: A) => ({
    method: 'GET',
    path,
    body: makeBody(...args),
    ...makeOptions?.(...args),
  }),
)

export const dataSuccess = <D>(result: Promise<DataResult<D>>): Promise<DataSuccess<D>> =>
  new Promise<DataSuccess<D>>((resolve, reject) => {
    result
      .then(dr => {
        if (dr.success) {
          resolve(dr)
        } else {
          reject(dr)
        }
      })
      .catch(reject)
  })
