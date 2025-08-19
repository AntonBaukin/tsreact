export { axiosFetcher } from './axios'
export { qosFetcher } from './qos'
export { dataGet, dataPost, dataSourceSwitch, dataSuccess } from './data'
export { autoTransform, autoTransformSimple } from './transformer'
export type {
  Fetcher,
  Query,
  Headers,
  Transform,
} from './types'
export {
  asTransform,
  asTransformArray,
  asDataSource,
  bodyNull,
  bodyJson,
  bodyText,
  nullFetcher,
} from './types'
