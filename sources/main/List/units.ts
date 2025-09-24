import { expectTrue } from 'sources/asserts'
import { makePayloadUnit } from 'sources/unit'
import { makeRouteChangeActUnit } from 'sources/main/routes'
import { defineOnlyUnit, makeFetchUnit, makeAccumUnit } from 'sources/main/context'
import { makeAccumExtractor } from 'sources/main/store/hooks'
import { Person } from 'sources/main/api/types'
import { personsSource } from 'sources/main/data'

export const fetchPersons = makeFetchUnit('fetchPersons', personsSource)

export const fetchPersonsAccum = makeAccumUnit(
  'fetchPersonsAccum',
  fetchPersons,
  makeAccumExtractor<Person>(),
)

export const listPageInit = makeRouteChangeActUnit({
  name: 'list.PageInit',
  routeId: 'list',
})

interface ListFetch {
  offset: number,
  limit?: number,
}

export const listFetch = makePayloadUnit(
  'list.Fetch',
  { offset: 0 } as ListFetch,
)

export const listDoFetch = defineOnlyUnit({
  name: 'list.DoFetch',
  actsOn: () => [listFetch],

  trigger(type: string, p: unknown) {
    expectTrue(type === 'list.Fetch')
    const { offset, limit = 10 } = p as ListFetch

    fetchPersons.fetch({
      query: { offset, limit, sort: 'name', order: 'asc' },
      body: {},
    })
  }
}).dataUnit

export const listInitialFetch = defineOnlyUnit({
  name: 'list.InitialFetch',
  actsOn: () => [listPageInit],

  trigger() {
    if (!fetchPersonsAccum.indexMap.get(0)) {
      listFetch.dispatchIt()
    }
  }
}).dataUnit
