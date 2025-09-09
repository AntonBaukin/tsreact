import { describe, expect, test } from '@jest/globals'
import axios from 'axios'
import express from 'express'
import {
  axiosFetcher,
  dataSuccess,
  Fetcher,
  nullFetcher,
  Headers,
  fetchUnitUnitilties,
} from 'sources/fetch'
import { makeExpress } from 'sources/fetch/base.test'
import { PersonsView, readDbUsers } from '../../../sample/db_users.mjs'
import dbUsersRouter from '../../../sample/db_users.router.mjs'
import { expectNever, expectProps } from 'sources/asserts'
import { ActionStep, asyncLogger, makeTestStore } from 'sources/unit/utils.test'
import makeDataSources, { AppDataSources } from './data'
import { Person } from './types'

const testServer = () => {
  const { app, startExpress, stopExpress } = makeExpress()
  const usersApi = express.Router()
  let fetcher: Fetcher = nullFetcher

  const {
    proxy: dataSources,
    assign: setDataSources,
  } = expectProps<AppDataSources>()

  app.use(express.json())
  app.use('/api/users', usersApi)

  const runExpress = async () => {
    const dbUsers = await readDbUsers()
    const personsView = new PersonsView(dbUsers)
    dbUsersRouter(usersApi, personsView)

    const { port } = await startExpress()

    const axiosInstance = axios.create({
      baseURL: `http://127.0.0.1:${port}`,
      timeout: 50,
    })

    fetcher = axiosFetcher(axiosInstance)
    setDataSources(makeDataSources(fetcher))
  }

  return {
    runExpress,
    stopExpress,
    dataSources,
  }
}

describe('api.fetchers', () => {
  const { runExpress, stopExpress, dataSources } = testServer()

  beforeAll(runExpress)
  afterAll(stopExpress)

  const personName = (p: Person) => `${p.lastName} ${p.firstName}`

  const totalCount = (h: Headers) => Number(h['x-total-count'])

  test('getAllPersons', async () => {
    const { personsAll } = dataSources
    const { result } = personsAll({ offset: 0, limit: 4, sort: 'name', order: 'asc' })
    const { success, data: persons, headers } = await dataSuccess(result)

    expect(success).toBeTruthy()

    expect(persons.map(personName)).toStrictEqual([
      'Allison Amiyah', 'Barron Clay', 'Bartlett Morgan', 'Barton Laila'
    ])

    expect(totalCount(headers)).toStrictEqual(100)
  })

  test('searchPersons', async () => {
    const { personsSearch } = dataSources
    const { result } = personsSearch({
      query: { offset: 0, limit: 4, sort: 'name', order: 'asc' },
      body: { name: 'rosa' },
    })

    const { success, data: persons, headers } = await dataSuccess(result)

    expect(success).toBeTruthy()

    expect(persons.map(personName)).toStrictEqual([
      'Li Rosa', 'Morrow Rosa'
    ])

    expect(totalCount(headers)).toStrictEqual(2)
  })

  test('personsSource.Get', async () => {
    const { personsSource } = dataSources
    const { result, request } = personsSource({
      query: { offset: 0, limit: 4, sort: 'name', order: 'asc' },
      body: {},
    })

    expect(request.method).toBe('GET')

    const { success, data: persons, headers } = await dataSuccess(result)

    expect(success).toBeTruthy()

    expect(persons.map(personName)).toStrictEqual([
      'Allison Amiyah', 'Barron Clay', 'Bartlett Morgan', 'Barton Laila'
    ])

    expect(totalCount(headers)).toStrictEqual(100)
  })

  test('personsSource.Post', async () => {
    const { personsSource } = dataSources
    const { result, request } = personsSource({
      query: { offset: 0, limit: 4, sort: 'name', order: 'asc' },
      body: { name: 'rosa' },
    })

    expect(request.method).toBe('POST')

    const { success, data: persons, headers } = await dataSuccess(result)

    expect(success).toBeTruthy()

    expect(persons.map(personName)).toStrictEqual([
      'Li Rosa', 'Morrow Rosa'
    ])

    expect(totalCount(headers)).toStrictEqual(2)
  })
})

describe('api.units', () => {
  const { runExpress, stopExpress, dataSources } = testServer()

  beforeAll(runExpress)
  afterAll(stopExpress)

  test('asyncLogger.timeout', async () => {
    const { stepsComplete } = asyncLogger(200, () => expectNever())
    await expect(stepsComplete()).rejects.toBe('Timeout-@[0]')
  })

  test('asyncLogger.1step', async () => {
    const { stepsComplete, finishSteps, logger } = asyncLogger(200, ({ index, type }) => {
      expect(index).toBe(0)
      expect(type).toBe('abc')
      finishSteps()
    })

    const send = (type: string) => logger({}, { type }, {})

    setTimeout(() => send('abc'), 50)
    await expect(stepsComplete()).resolves.toBe(1)
  })

  test('asyncLogger.3steps', async () => {
    const { stepsComplete, finishSteps, logger } = asyncLogger(200, ({ index, type }) => {
      if (index === 0) {
        expect(type).toBe('a')
      } else if (index === 1) {
        expect(type).toBe('b')
      } else if (index === 2) {
        expect(type).toBe('c')
        finishSteps()
      } else {
        expectNever()
      }
    })

    const send = (type: string) => logger({}, { type }, {})

    setTimeout(() => send('a'), 50)
    setTimeout(() => send('b'), 100)
    setTimeout(() => send('c'), 150)

    await expect(stepsComplete()).resolves.toBe(3)
  })

  test('fetchPersons', async () => {
    const { personsSource } = dataSources
    const { stepsComplete, finishSteps, failSteps, logger } = asyncLogger(1000, stepper)
    const { appContext, select, registerUnits, uu } = makeTestStore(logger, asyncError)
    const { defineFetchUnit } = fetchUnitUnitilties(appContext, uu)
    const fetchPersons = defineFetchUnit('fetchPersons', personsSource)

    registerUnits(fetchPersons)

    function stepper({ index, diff }: ActionStep) {
      if (index === 0) {
        expect(diff.fetchPersons).toMatchObject({
          isLoading: true,
        })
      } else if (index === 1) {
        expect(diff.fetchPersons).toMatchObject({
          isLoading: false,
          success: true,
          headers: {
            'x-total-count': '2',
          },
          data: [
            {
              firstName: 'Rosa',
              lastName: 'Li',
            },
            {
              firstName: 'Rosa',
              lastName: 'Morrow',
            },
          ],
        })

        finishSteps()
      } else {
        expectNever()
      }
    }

    function asyncError (e: unknown) {
      if (e) {
        console.error(e)
        failSteps(e)
      }
    }

    fetchPersons.fetch({
      query: { offset: 0, limit: 4, sort: 'name', order: 'asc' },
      body: { name: 'rosa' },
    })

    await stepsComplete()
  })
})
