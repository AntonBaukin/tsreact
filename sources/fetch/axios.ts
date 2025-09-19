import { AxiosInstance, AxiosRequestConfig } from 'axios'
import { expectNever } from 'sources/asserts'
import { get, isBoolean, isObject, isString, isNil } from 'sources/lodash'
import { Payload } from 'sources/unit'
import {
  Fetcher,
  nextFetchId,
  Request,
  Response,
  Headers,
  Body,
  Abort,
  mimeJson,
  mimeText,
  bodyNull,
} from './types'

export const axiosFetcher =
  (axios: AxiosInstance): Fetcher =>
  (request: Request, extId?: number) => {
    const abortController = new AbortController()
    let aborted: any = undefined
    const id = extId ?? nextFetchId()
    const sentAt = Date.now()

    const abort: Abort = (reason) => {
      aborted = reason || true
      abortController.abort(reason)
    }

    const config: AxiosRequestConfig = {
      url: request.path,
      method: request.method.toLowerCase(),
      allowAbsoluteUrls: false,
      headers: request.headers,
      params: request.query,
      signal: abortController.signal,
    }

    const { progress: onDownloadProgress } = request
    if (onDownloadProgress) {
      config.onDownloadProgress = (event) => {
        onDownloadProgress(event.loaded, event.lengthComputable ? event.total : undefined)
      }
    }

    if ('upload' in request) {
      const { upload: onUploadProgress } = request
      if (onUploadProgress) {
        config.onUploadProgress = (event) => {
          onUploadProgress(event.loaded, event.lengthComputable ? event.total : undefined)
        }
      }
    }

    if ('body' in request) {
      const { body } = request

      if (body.mime) {
        config.headers = {
          ...config.headers,
          'content-type': body.mime,
        }
      }

      switch (body.type) {
        case 'text': {
          config.data = body.text
          break
        }

        case 'json': {
          config.data = body.json
          break
        }

        case 'null': {
          break
        }

        default: {
          expectNever()
        }
      }
    }

    const isContentType = (contentType: string, mime: string) =>
      mime === contentType || contentType.startsWith(mime + ';')

    const makeBody = (data: unknown, contentType: string, status: number): Body => {
      if (
        (status === 204 || status >= 300) &&
        isString(data) &&
        !data.length
      ) {
        return bodyNull()
      }

      if (
        isString(data) ||
        (!isNil(data) && isContentType(contentType, mimeText))
      ) {
        return {
          type: 'text',
          mime: mimeText,
          text: String(data),
        }
      }

      if (isObject(data) || Number.isFinite(data) || isBoolean(data)) {
        return {
          type: 'json',
          mime: mimeJson,
          json: data as Payload,
        }
      }

      return bodyNull()
    }

    const makeResponse = (response: unknown, error?: unknown): Response => {
      const status = get(response, 'status', 503) as number
      const headers = get(response, 'headers', {}) as Headers
      const body = makeBody(get(response, 'data'), headers['content-type'] ?? '', status)
      const doneAt = Date.now()
      const success = !error

      const result: Response = {
        success,
        status,
        doneAt,
        headers,
        body,
      }

      if (error) {
        result.error = error
      }

      if (aborted) {
        result.aborted = aborted
      }

      return result
    }

    const result = new Promise<Response>((resolve) => {
      axios(config)
        .then((response) => {
          resolve(makeResponse(response))
        })
        .catch((error) => {
          resolve(makeResponse(get(error, 'response'), error))
        })
    })

    return {
      id,
      sentAt,
      request,
      result,
      abort,
    }
  }
