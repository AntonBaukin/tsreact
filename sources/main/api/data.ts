import { isEmpty } from 'sources/lodash'
import {
  asTransformArray,
  bodyJson,
  dataGet,
  dataPost,
  Fetcher,
  Transform,
  Query,
  dataSourceSwitch,
  asDataSource,
} from 'sources/fetch'
import {
  Person,
  PersonsQueryRange,
  QueryAndBody,
  SearchPersons,
} from './types'
import { trPerson } from './transforms'

/**
 * Selects one of the paired GET-POST table requests,
 * preferring GET over POST when the filter body is empty.
 */
const getOrPostRange = <Q extends {}, B extends {}, D>(
  fetcher: Fetcher,
  transform: Transform<D>,
  pathGet: string,
  pathPost: string,
) => {
  const get = dataGet (
    fetcher,
    asTransformArray(transform),
    pathGet,
    (query: Q) => query as Query,
  )

  const getAsPost = asDataSource(({ query }: QueryAndBody<Q, B>) => get(query))

  const post = dataPost (
    fetcher,
    asTransformArray(transform),
    pathPost,
    ({ body }: QueryAndBody<Q, B>) => bodyJson(body),
    ({ query }: QueryAndBody<Q, B>) => ({ query }),
  )

  const switcher = dataSourceSwitch(
    { getAsPost, post },
    ({ body }: QueryAndBody<Q, B>) => isEmpty(body) ? 'getAsPost' : 'post',
  )

  return { get, post, switcher }
}

export type AppDataSources = ReturnType<typeof makeAppDataSources>

export default makeAppDataSources

function makeAppDataSources (fetcher: Fetcher) {
  const { get: personsAll, post: personsSearch, switcher: personsSource } =
    getOrPostRange <PersonsQueryRange, SearchPersons, Person> (
      fetcher,
      trPerson,
      '/api/users/all',
      '/api/users/search',
    )

  return {
    personsAll,
    personsSearch,
    personsSource,
  }
}
