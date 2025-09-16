import { defineUnit, defineFetchUnit } from 'sources/main/context'
import { personsSource } from 'sources/main/data'

export * from './temp/units'

export const fetchPersons = defineFetchUnit('fetchPersons', personsSource)

export const listPageInit = defineUnit({ name: 'list.PageInit' }).dataUnit
