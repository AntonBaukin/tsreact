import { defineOnlyUnit, defineFetchUnit } from 'sources/main/context'
import { makeRouteChangeActUnit } from 'sources/main/routes'
import { personsSource } from 'sources/main/data'

export * from './temp/units'

export const fetchPersons = defineFetchUnit('fetchPersons', personsSource)

export const listPageInit = makeRouteChangeActUnit({
  name: 'list.PageInit',
  routeId: 'list',
})

export const listInitialFetch = defineOnlyUnit({
  name: 'listInitialFetch',

  actsOn: () => [listPageInit],

  trigger() {
    fetchPersons.fetch({
      query: { offset: 0, limit: 10, sort: 'name', order: 'asc' },
      body: {},
    })
  }
}).dataUnit
