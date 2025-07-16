import { describe, expect, test } from '@jest/globals'
import { expectTrue } from 'sources/asserts'
import { Method, QoS } from './types'
import {
  Backoff,
  fibonacciBackoffer,
  QoSBackoffFeedback,
  QoSConfig,
  qosDelays,
  qosFallbackWithBackoff,
  qosFetcher,
} from './qos'
import { makeTestRequest, ResponderClause, testSequence } from './base.test'

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

  const fbFallbackWithFeedbackCollector = () => {
    const feedbacks: QoSBackoffFeedback[] = []

    const fb = qosFallbackWithBackoff(
      fb1MsBackoffer(),
      (feedback) => {
        feedbacks.push(feedback)
      },
    )

    return { fb, feedbacks }
  }

  const testQosFetcher = (config: QoSConfig, clause: ResponderClause) => {
    const { fb, feedbacks } = fbFallbackWithFeedbackCollector()
    const makeQosFetcher = qosFetcher(config, fb)
    const seq = testSequence(clause, makeQosFetcher)

    return { feedbacks, seq }
  }

  test('bypass', async () => {
    const { feedbacks, seq } = testQosFetcher(
      { timeout: 1, retries: 1 },
      ({ id, text, response, request }) => {
        expectTrue(id === 1)
        expectTrue(request.retry === undefined)
        response.text = 'Success!'
      },
    )

    await expect(seq().result).resolves.toMatchObject({
      status: 200,
      success: true,
      body: { type: 'text', mime: 'text/plain', text: 'Success!' }
    })

    expect(feedbacks).toStrictEqual([])
  })

  test('off', async () => {
    const { feedbacks, seq } = testQosFetcher(
      { timeout: 1, retries: 1 },
      ({ id, text, response }) => {
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
      path: expect.stringMatching(/^[/]/),
      qos: expect.stringMatching(/^(standard|required|off)$/),
      retry: expect.any(Number),
      timeout: expect.any(Number),
    })

    return { error, request }
  }

  test('retryFailed', async () => {
    const { feedbacks, seq } = testQosFetcher(
      { timeout: 1, retries: 1 },
      ({ id, text, response }) => {
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

    expect(fetch.request.retry).toBe(2)

    const { error, request } = feedbackMatchers()

    expect(feedbacks).toMatchObject([
      { kind: 'E', id: 1, retry: 1, retries: 1, error, request },
      { kind: 'B', id: 1, retry: 2, retries: 0, backoff: { delay: 1 } },
      { kind: 'F', id: 1, retry: 2, retries: 0 },
      { kind: 'X', id: 1, retry: 2, retries: 0, error },
    ])
  })
})
