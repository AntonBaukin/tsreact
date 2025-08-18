import { describe, expect, test } from '@jest/globals'
import axios, { AxiosError } from 'axios'
import { expectTrue } from 'sources/asserts'
import { isString } from 'sources/lodash'
import { Fetcher, QoS, Query, Headers, Request, nullFetcher } from './types'
import { axiosFetcher } from './axios'
import { Backoff, fibonacciBackoffer, QoSConfig, qosDelays, qosFetcher } from './qos'
import {
  fbFallbackWithFeedbackCollector,
  makeExpress,
  makeTestRequest,
  ResponderClause,
  testSequence,
} from './base.test'

describe('fetch', () => {
  test('sequence', async () => {
    const seq = testSequence(({ id, text, response }) => {
      if (id === 3) {
        throw 'Hoops :('
      }

      response.text = text ? `${id}: ${text}` : String(id)
    })

    await expect(seq().result).resolves.toMatchObject({
      status: 200,
      success: true,
      body: { type: 'text', mime: 'text/plain', text: '1' }
    })

    await expect(seq({ text: 'Hello!' }).result).resolves.toMatchObject({
      body: { text: '2: Hello!' },
    })

    await expect(seq().result).resolves.toMatchObject({
      status: 503,
      success: false,
      error: 'Hoops :(',
      body: { type: 'null' },
    })
  })
})

describe('fallback', () => {
  test('backoffer', () => {
    const fb = fibonacciBackoffer()

    const collect = (qos: QoS) => {
      const r = makeTestRequest({ qos })
      const c = {} as QoSConfig
      const p: Backoff[] = []

      return Array(8).fill(0).map((_, i) => {
        p.push(fb(p, i, r, c))
        return p[p.length - 1]
      })
        .map(({ delay }) => delay)
    }

    expect(collect(QoS.STD)).toStrictEqual(
      [1000, 2500, 3500, 6000, 9500, 15500, 25000, 40500]
    )

    expect(collect(QoS.REQ)).toStrictEqual(
      [300, 800, 1100, 1900, 3000, 4900, 7900, 12800]
    )
  })

  const fb1MsBackoffer = () => fibonacciBackoffer(qosDelays(1, 1), qosDelays(1, 1))

  const testQosFetcher = (config: QoSConfig, clause: ResponderClause) => {
    const { fb, feedbacks } = fbFallbackWithFeedbackCollector(fb1MsBackoffer())
    const makeQosFetcher = qosFetcher(config, fb)
    const seq = testSequence(clause, makeQosFetcher)

    return { feedbacks, seq }
  }

  test('bypass', async () => {
    const { feedbacks, seq } = testQosFetcher(
      { timeout: 1, retries: 1 },
      ({ id, response, request }) => {
        expectTrue(id === 1)
        expectTrue(request.retry === undefined)
        response.text = 'Success!'
      },
    )

    await expect(seq().result).resolves.toMatchObject({
      status: 200,
      success: true,
      body: { type: 'text', text: 'Success!' }
    })

    expect(feedbacks).toStrictEqual([])
  })

  test('off', async () => {
    const { feedbacks, seq } = testQosFetcher(
      { timeout: 1, retries: 1 },
      ({ id, response }) => {
        expectTrue(id === 1)
        response.success = false
      },
    )

    const fetch = seq({ qos: QoS.OFF })

    await expect(fetch.result).resolves.toMatchObject({
      status: 503,
      success: false,
      body: { type: 'null' }
    })

    expect(fetch.request.retry).toBeUndefined()
    expect(feedbacks).toStrictEqual([])
  })

  const feedbackMatchers = () => {
    const error = expect.any(Error)

    const request = expect.objectContaining({
      method: expect.stringMatching(/^(GET|POST)$/),
      headers: expect.any(Object),
      query: expect.any(Object),
      path: expect.stringMatching(/^\//),
      qos: expect.stringMatching(/^(standard|required|off)$/),
      timeout: expect.any(Number),
    })

    return { error, request }
  }

  test('retryFailed', async () => {
    const { feedbacks, seq } = testQosFetcher(
      { timeout: 1, retries: 1 },
      ({ id, response }) => {
        expectTrue(id === 1)
        response.success = false
      },
    )

    const fetch = seq()

    await expect(fetch.result).resolves.toMatchObject({
      status: 503,
      success: false,
      body: { type: 'null' }
    })

    expect(fetch.request.retry).toBe(1)

    const { request } = feedbackMatchers()

    expect(feedbacks).toMatchObject([
      { kind: 'E', id: 1, retry: 0, retries: 1, request },
      { kind: 'B', id: 1, retry: 1, retries: 1, backoff: { delay: 1 } },
      { kind: 'F', id: 1, retry: 1, retries: 1 },
      { kind: 'X', id: 1, retry: 1, retries: 1 },
    ])
  })

  test('retrySuccess', async () => {
    const { feedbacks, seq } = testQosFetcher(
      { timeout: 1, retries: 1 },
      ({ id, response, request }) => {
        expectTrue(id === 1)
        if (request.retry === 1) {
          response.success = true
          response.text = 'Retried'
        } else {
          response.success = false
        }
      },
    )

    const fetch = seq()

    await expect(fetch.result).resolves.toMatchObject({
      status: 200,
      success: true,
      body: { type: 'text', text: 'Retried' }
    })

    expect(fetch.request.retry).toBe(1)

    const { request } = feedbackMatchers()

    expect(feedbacks).toMatchObject([
      { kind: 'E', id: 1, retry: 0, retries: 1, request },
      { kind: 'B', id: 1, retry: 1, retries: 1, backoff: { delay: 1 } },
      { kind: 'F', id: 1, retry: 1, retries: 1 },
      { kind: '!', id: 1, retry: 1, retries: 1 },
    ])
  })
})

describe('express', () => {
  const { app, startExpress, stopExpress } = makeExpress()
  let baseFetcher: Fetcher = nullFetcher

  beforeAll(async () => {
    const { port } = await startExpress()

    const axiosInstance = axios.create({
      baseURL: `http://127.0.0.1:${port}`,
      timeout: 50,
    })

    baseFetcher = axiosFetcher(axiosInstance)
  })

  afterAll(async () => {
    await stopExpress()
  })

  app.get('/abc', (req, res) => {
    const [a, b, c] = [Number(req.query.a), Number(req.query.b), Number(req.query.c)]
    const x = (i: number) => Number.isFinite(i) && Number.isInteger(i)

    if (!x(a) || !x(b) || !x(c)) {
      res.status(400).end()
    } else {
      res.setHeader('Content-Type', 'text/plain')
      res.status(200).send(`${a + b + c}`)
    }
  })

  const reqGet = (path: string, query?: Query, qos?: QoS) =>
    makeTestRequest({ path, query, qos })

  test('abc200', async () => {
    const fetcher = baseFetcher
    const request = reqGet('/abc', { a: 1, b: 2, c: 3 })
    const fetch = fetcher(request, 1)

    await expect(fetch.result).resolves.toMatchObject({
      status: 200,
      success: true,
      doneAt: expect.any(Number),
      body: { type: 'text', mime: 'text/plain', text: '6' },
      headers: {
        'x-powered-by': 'Express',
        'content-length': '1',
        'content-type': 'text/plain; charset=utf-8',
      },
    })
  })

  test('abc400', async () => {
    const fetcher = baseFetcher
    const request = reqGet('/abc', { a: 1, b: true, c: 3 })
    const fetch = fetcher(request, 1)

    await expect(fetch.result).resolves.toMatchObject({
      status: 400,
      success: false,
      body: { type: 'null' },
      error: expect.any(AxiosError),
    })
  })

  app.get('/204', (_, res) => {
    res.status(204).end()
  })

  test('204', async () => {
    const fetcher = baseFetcher
    const request = reqGet('/204')
    const fetch = fetcher(request, 1)

    await expect(fetch.result).resolves.toMatchObject({
      status: 204,
      success: true,
      body: { type: 'null' },
    })
  })

  const fb50MsBackoffer = () => fibonacciBackoffer(qosDelays(50, 50), qosDelays(50, 50))

  const testBackoffFetcher = (retries: number, tune?: (r: Request) => void) => {
    const { fb, feedbacks } = fbFallbackWithFeedbackCollector(fb50MsBackoffer(), tune)
    const makeQosFetcher = qosFetcher({ retries, timeout: 50 }, fb)
    const fetcher = makeQosFetcher(baseFetcher)

    return { feedbacks, fetcher }
  }

  test('abc200Bypass', async () => {
    const { fetcher, feedbacks } = testBackoffFetcher(1)
    const request = reqGet('/abc', { a: 1, b: 2, c: 3 })
    const fetch = fetcher(request, 1)

    await expect(fetch.result).resolves.toMatchObject({
      status: 200,
      success: true,
      body: { text: '6' },
    })

    expect(feedbacks).toStrictEqual([])
  })

  test('abc400QoSOff', async () => {
    const { fetcher, feedbacks } = testBackoffFetcher(1)
    const request = reqGet('/abc', { a: 1, b: true, c: 3 }, QoS.OFF)
    const fetch = fetcher(request, 1)

    await expect(fetch.result).resolves.toMatchObject({
      status: 400,
      success: false,
      body: { type: 'null' },
      error: expect.any(AxiosError),
    })

    expect(feedbacks).toStrictEqual([])
  })

  test('abc400QoSDeny', async () => {
    const { fetcher, feedbacks } = testBackoffFetcher(1)
    const request = reqGet('/abc', { a: 1, b: true, c: 3 })
    const fetch = fetcher(request, 1)

    await expect(fetch.result).resolves.toMatchObject({
      status: 400,
      success: false,
      body: { type: 'null' },
      error: expect.any(AxiosError),
    })

    expect(feedbacks).toStrictEqual([])
  })

  const reqGetHeaders = (path: string, headers: Headers) =>
    makeTestRequest({ path, headers })

  app.get('/headers', (req, res) => {
    const h = req.headers['test-content']

    if (!isString(h)) {
      res.status(400).end()
    } else {
      res.setHeader('Content-Type', 'text/plain')
      res.setHeader('Test-Status', 'Done')
      res.status(200).send(h.split('').reverse().join(''))
    }
  })

  test('headers', async () => {
    const fetcher = baseFetcher
    const request = reqGetHeaders('/headers', { 'Test-Content': 'Stop pots' })
    const fetch = fetcher(request, 1)

    await expect(fetch.result).resolves.toMatchObject({
      status: 200,
      success: true,
      body: { type: 'text', text: 'stop potS' },
      headers: {
        'test-status': 'Done',
        'content-length': '9',
      },
    })
  })

  app.get('/retry', (req, res) => {
    const retry = Number(req.headers['retry'])
    const retries = Number(req.headers['retries'])
    const x = (i: number) => Number.isFinite(i) && Number.isInteger(i)

    if (x(retry) && x(retries)) {
      if (retry >= retries) {
        res.setHeader('Content-Type', 'text/plain')
        res.status(200).send(`Done ${retry} of ${retries}`)
      } else {
        res.status(503).end()
      }
    } else {
      res.status(400).end()
    }
  })

  test('retrySuccess', async () => {
    const retries = 3

    const { fetcher, feedbacks } = testBackoffFetcher(retries, (req) => {
      req.headers = { retries: String(retries), retry: String(req.retry ?? 0) }
    })

    const request = reqGetHeaders('/retry', { retries: String(retries), retry: '0' })
    const fetch = fetcher(request, 1)

    await expect(fetch.result).resolves.toMatchObject({
      status: 200,
      success: true,
      body: { text: 'Done 3 of 3' },
    })

    expect(feedbacks).toMatchObject([
      { kind: 'E', retry: 0, retries: 3, result: { status: 503, success: false } },
      { kind: 'B', retry: 1, retries: 3, backoff: { delay: 50 } },
      { kind: 'F', retry: 1, retries: 3, request: { headers: { retry: '1' } } },
      { kind: 'E', retry: 1, retries: 3, result: { status: 503 } },
      { kind: 'B', retry: 2, retries: 3, backoff: { delay: 100 } },
      { kind: 'F', retry: 2, retries: 3, request: { headers: { retry: '2' } } },
      { kind: 'E', retry: 2, retries: 3, result: { status: 503 } },
      { kind: 'B', retry: 3, retries: 3, backoff: { delay: 150 } },
      { kind: 'F', retry: 3, retries: 3, request: { headers: { retry: '3' } } },
      { kind: '!', retry: 3, retries: 3, result: { status: 200, success: true } },
    ])
  })
})
