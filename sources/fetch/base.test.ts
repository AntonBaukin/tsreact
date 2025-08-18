import express from 'express'
import { expectNotNil } from 'sources/asserts'
import { cloneDeep, get, noop } from 'sources/lodash'
import {
  Backoffer,
  QoSBackoffFeedback,
  qosFallbackWithBackoff,
} from './qos'
import {
  Abort,
  Body,
  FetcherHOF,
  fetcherIdentityHOF,
  isBodyJson,
  isBodyText,
  mimeJson,
  mimeText,
  QoS,
  Request,
  RequestBase,
  Response,
} from './types'

type TestResponder = (id: number, request: Request, abort: Abort) => Promise<Response>

const testFetcher = (responder: TestResponder) => (request: Request, extId?: number) => {
  const id = expectNotNil(extId)
  const sentAt = Date.now()
  let aborted: any = false

  const abort: Abort = (reason) => {
    aborted = reason || true
  }

  const result = responder(id, request, abort)
    .then(response => {
      if (aborted) {
        response.aborted = aborted
      }

      return response
    })
    .catch(error => {
      const response: Response = {
        success: false,
        status: 503,
        error,
        doneAt: 0,
        headers: {},
        body: { type: 'null' },
      }

      if (aborted) {
        response.aborted = aborted
      }

      return response
    })

  return {
    id,
    sentAt,
    request,
    result,
    abort,
  }
}

type TestBody = Partial<{ body: Body } & { json: any } & { text: string }>

type ResponderResponse = Partial<
  Pick<Response, 'success' | 'status' | 'headers'> & TestBody
>

const makeTestBody = (b: TestBody): Body => {
  if (b.body) {
    return b.body
  }

  if (b.json) {
    return { type: 'json', mime: mimeJson, json: b.json }
  }

  if (b.text) {
    return { type: 'text', mime: mimeText, text: b.text }
  }

  return { type: 'null' }
}

const makeTestResponse = (r: ResponderResponse): Response => ({
  success: r.success ?? true,
  status: r.status ?? (r.success === false ? 503 : 200),
  doneAt: 0,
  headers: r.headers ?? {},
  body: makeTestBody(r),
})

interface ResponderBlock {
  id: number,
  abort: Abort,
  request: Request,
  response: ResponderResponse,
  // Request body (POST, or BodyNull):
  body: Body,
  // Object of JSON request body, or empty object:
  json: any,
  // Text of text request body, or empty string:
  text: string,
}

export type ResponderClause = (block: ResponderBlock) => void

const testResponder = (clause: ResponderClause): TestResponder =>
  (id: number, request: Request, abort: Abort) => {
    const body: Body = 'body' in request ? request.body : { type: 'null' }
    const json = isBodyJson(body) ? body.json : {}
    const text = isBodyText(body) ? body.text : ''
    const response: ResponderResponse = {}

    try {
      clause({
        id,
        abort,
        request,
        response,
        body,
        json,
        text,
      })
    } catch (error: unknown) {
      return Promise.resolve<Response>({
        success: false,
        status: 503,
        error,
        doneAt: 0,
        headers: {},
        body: { type: 'null' },
      })
    }

    return Promise.resolve<Response>(makeTestResponse(response))
  }

type TestRequest = Partial<
  Pick<RequestBase, 'path' | 'method' | 'query' | 'headers' | 'qos'> & TestBody
>

export const makeTestRequest = (r: TestRequest): Request => {
  const base = {
    path: r.path || '/',
    query: r.query ?? {},
    headers: r.headers ?? {},
    qos: r.qos ?? QoS.STD,
  }

  if ('body' in r || 'text' in r || 'json' in r || r.method === 'POST') {
    return { method: 'POST', ...base, body: makeTestBody(r) }
  } else {
    return { method: 'GET', ...base }
  }
}

export const testSequence = (
  clause: ResponderClause,
  hof: FetcherHOF = fetcherIdentityHOF,
) => {
  const responder = testResponder(clause)
  const fetcher = hof(testFetcher(responder))
  let id = 0

  return (r: TestRequest = {}) => fetcher(makeTestRequest(r), ++id)
}

export const fbFallbackWithFeedbackCollector = (
  backoffer: Backoffer,
  tune?: (r: Request) => void,
) => {
  const feedbacks: QoSBackoffFeedback[] = []

  const fb = qosFallbackWithBackoff(
    backoffer,
    (feedback) => {
      feedbacks.push(cloneDeep(feedback))
    },
    tune,
  )

  return { fb, feedbacks }
}

export const makeExpress = () => {
  const app = express()
  let server: ReturnType<typeof app['listen']> | undefined
  let resolvePort: ((p: number) => void) = noop

  const portPromise = new Promise<number>((resolve) => {
    resolvePort = resolve
  })

  const startExpress = async () => {
    server = app.listen(0, () => {
      resolvePort(get(server?.address(), 'port', 0))
    })

    const port = await portPromise

    return { port }
  }

  const stopExpress = async () => {
    if (server) {
      let shutdown = noop
      const shutdownPromise = new Promise((resolve) => {
        shutdown = resolve
      })

      server.close(() => {
        shutdown()
      })

      await shutdownPromise
    }
  }

  return { app, startExpress, stopExpress }
}
