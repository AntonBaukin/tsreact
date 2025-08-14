import { describe, expect, test } from '@jest/globals'
import axios, { AxiosError } from 'axios'
import express from 'express'
import { axiosFetcher, Fetcher, nullFetcher } from 'sources/fetch'
import { makeExpress } from 'sources/fetch/fetch.test'
import { PersonsView, readDbUsers } from '../../../sample/db_users.mjs'
import dbUsersRouter from '../../../sample/db_users.router.mjs'

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

  test('getAllPersons', () => {

  })
})
