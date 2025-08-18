import { asTransformArray, dataGet, Fetcher } from 'sources/fetch'
import { PersonsQueryRange } from './types'
import { trPerson } from './transforms'

export default (fetcher: Fetcher) => {
  const personsAll = dataGet (
    fetcher,
    asTransformArray(trPerson),
    '/api/users/all',
    (query: PersonsQueryRange) => query,
  )

  return { personsAll }
}
