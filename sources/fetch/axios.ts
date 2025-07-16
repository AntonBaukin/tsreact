import { AxiosInstance, AxiosRequestConfig } from 'axios'
import { get, isObject, isString } from 'sources/lodash'
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

    const makeBody = (data: unknown): Body => {
      if (isString(data)) {
        return {
          type: 'text',
          mime: mimeText,
          text: data,
        }
      }

      if (isObject(data)) {
        return {
          type: 'json',
          mime: mimeJson,
          json: data as Payload,
        }
      }

      return { type: 'null' }
    }

    const makeResponse = (response: unknown, error?: unknown): Response => {
      const result: Response = {
        success: !error,
        status: get(response, 'status', 503) as number,
        doneAt: Date.now(),
        headers: get(response, 'headers', {}) as Headers,
        body: makeBody(get(response, 'data')),
      }

      if (error) {
        result.error = error
      }

      if (aborted) {
        result.aborted = aborted
      }

      return result
    }

    const result = new Promise<Response>((resolve, reject) => {
      axios(config)
        .catch((error) => {
          reject(makeResponse(get(error, 'response'), error))
        })
        .then((response) => {
          resolve(makeResponse(response))
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
