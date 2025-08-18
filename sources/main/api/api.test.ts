import { describe, expect, test } from '@jest/globals'
import axios from 'axios'
import express from 'express'
import { axiosFetcher, dataSuccess, Fetcher, nullFetcher } from 'sources/fetch'
import { makeExpress } from 'sources/fetch/base.test'
import { PersonsView, readDbUsers } from '../../../sample/db_users.mjs'
import dbUsersRouter from '../../../sample/db_users.router.mjs'
import makeDataSources from './data'
import { Person } from './types'

describe('api', () => {
  const { app, startExpress, stopExpress } = makeExpress()
  const usersApi = express.Router()
  let fetcher: Fetcher = nullFetcher

  app.use(express.json())
  app.use('/api/users', usersApi)

  beforeAll(async () => {
    const dbUsers = await readDbUsers()
    const personsView = new PersonsView(dbUsers)
    dbUsersRouter(usersApi, personsView)

    const { port } = await startExpress()

    const axiosInstance = axios.create({
      baseURL: `http://127.0.0.1:${port}`,
      timeout: 50,
    })

    fetcher = axiosFetcher(axiosInstance)
  })

  afterAll(async () => {
    await stopExpress()
  })

  const personName = (p: Person) => `${p.lastName} ${p.firstName}`

  test('getAllPersons', async () => {
    const { personsAll } = makeDataSources(fetcher)
    const { result } = personsAll({ offset: 0, limit: 4, sort: 'name', order: 'asc' })
    const { success, data: persons, headers } = await dataSuccess(result)

    expect(success).toBeTruthy()

    expect(persons.map(personName)).toStrictEqual([
      'Allison Amiyah', 'Barron Clay', 'Bartlett Morgan', 'Barton Laila'
    ])

    expect(Number(headers['x-total-count'])).toStrictEqual(100)
  })
})
