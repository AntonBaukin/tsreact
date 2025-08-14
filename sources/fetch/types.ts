import { expectTrue } from 'sources/asserts'
import { isArrayLike, isFunction, noop } from 'sources/lodash'
import { Payload } from 'sources/unit'

export type Headers = Record<string, string>

export type Value = string | number | boolean

export type Query = Record<string, Value | Value[]>

export type Method = 'GET' | 'POST'

export enum QoS {
  // Request is required for the application to work:
  REQ = 'required',
  // Ordinary request, may be rejected on failure (the default):
  STD = 'standard',
  // Disable QoS wrappers (ordinary single request):
  OFF = 'off',
}

export interface RequestBase {
  path: string,
  method: Method,
  query?: Query,
  headers?: Headers,
  timeout?: number,
  qos?: QoS, // * = QoS.STD
  // Fallback retry index: 1..
  retry?: number,
  // Download progress handler:
  progress?: (loaded: number, total: number | undefined) => void,
}

export interface Get extends RequestBase {
  method: 'GET',
}

export type BodyType = 'null' | 'json' | 'text'

export interface BodyBase {
  type: BodyType,
  mime?: string,
}

export interface BodyNull extends BodyBase {
  type: 'null',
}

export const mimeJson = 'application/json'

export interface BodyJson extends BodyBase {
  type: 'json',
  mime: typeof mimeJson,
  json: Payload,
}

export const mimeText = 'text/plain'

export interface BodyText extends BodyBase {
  type: 'text',
  mime: typeof mimeText,
  text: string,
}

export type Body = BodyNull | BodyJson | BodyText

export const isBodyNull = (b: Body): b is BodyNull => b.type === 'null'
export const isBodyJson = (b: Body): b is BodyJson => b.type === 'json'
export const isBodyText = (b: Body): b is BodyText => b.type === 'text'

export interface PostBase extends RequestBase {
  body: Body,
  // Upload progress handler:
  upload?: (loaded: number, total: number | undefined) => void,
}

export interface Post extends PostBase {
  method: 'POST',
}

export type Request = Get | Post

export interface Response {
  success: boolean,
  status: number,
  error?: unknown,
  aborted?: any,
  doneAt: number,
  headers: Headers,
  body: Body,
}

export type Abort = (reason?: any) => void

export interface Fetch {
  id: number,
  sentAt: number,
  request: Request,
  result: Promise<Response>,
  abort: Abort,
}

let fetchId = 1

export const nextFetchId = () => (fetchId++)

export interface Fetcher {
  (request: Request, id?: number): Fetch,
}

export const nullFetcher: Fetcher = (request: Request, id?: number) => ({
  id: id ?? nextFetchId(),
  sentAt: Date.now(),
  request,
  abort: noop,
  result: Promise.resolve({
    success: false,
    status: 501,
    doneAt: Date.now(),
    headers: {},
    body: { type: 'null' },
  }),
})

export type FetcherHOF = (f: Fetcher) => Fetcher

export const fetcherIdentityHOF = (f: Fetcher) => f

export const symTransform = Symbol.for('Transform')

export interface Transform<D> {
  (source: any): D

  readonly isTransform: typeof symTransform,
}

export const isTransform = <D>(some: unknown): some is Transform<D> =>
  isFunction(some) && (some as any).isTransform === symTransform

export const asTransform = <D>(f: (source: any) => D): Transform<D> => {
  Object.assign(f, { isTransform: symTransform })
  return f as Transform<D>
}

export const asTransformArray = <D> (
  f: (source: any) => D,
): Transform<D[]> => asTransform((source: any): D[] => {
  const results: D[] = []

  expectTrue(isArrayLike(source))
  for (const item of source) {
    results.push(f(item))
  }

  return results
})

export const symDataSource = Symbol.for('DataSource')

export interface DataResultBase {
  success: boolean,
  headers: Headers,
}

export interface DataSuccess<D> extends DataResultBase {
  success: true,
  data: D,
}

export interface DataError extends DataResultBase {
  success: false,
  aborted?: any,
  error?: unknown,
}

export type DataResult<D> = DataSuccess<D> | DataError

export interface PendingData<D> {
  result: Promise<DataResult<D>>,
  abort?: Abort,
}

export interface DataSource<D, A extends any[]> {
  (...args: A): PendingData<D>

  readonly dataSource: typeof symDataSource
}

export const isDataSource = <D, A extends any[]>(some: unknown):
  some is DataSource<D, A> =>
    isFunction(some) && (some as any).dataSource === symDataSource
