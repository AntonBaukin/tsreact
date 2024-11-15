import assert from 'node:assert'
import { isNil, isObject, isString } from './lodash.mjs'

export const wrapReqRes = (handler) => (req, res, next) =>
  handleReqRes(req, res, next, handler)

const handleReqRes = (req, res, next, handler) => {
  try {
    const result = handler(req, res, next)

    if (Array.isArray(result) || isObject(result)) {
      res.json(result)
    }
  } catch (e) {
    if (e instanceof StatusError) {
      res.sendStatus(e.code)
      return
    } else {
      next(e)
    }
  }
}

export const wrapReqPrepare = (view, handler) => (req, res, next) =>
  handleReqRes(req, res, next, () => {
    const { reverse, sort } = reqSortOrder(req)
    const { offset, limit } = reqLimitOffset(req)
    const entities = handler(req, res, next)

    if (isNil(entities)) {
      if (!res.headersSent) {
        res.sendStatus(204)
      }
      return
    }

    if (offset > 0 || limit !== undefined) {
      res.set('X-Total-Count', entities.length)
    }

    return view.prepare(entities, { reverse, offset, limit })
  })

export const makeReqPrepare = (handler) => (view) =>
  wrapReqPrepare(view, handler.bind(null, view))

export const makeReqBodyPrepare = (handler) => (view) =>
  wrapReqPrepare(
    view,
    (req, res, next) => {
      badReqAssert(req.headers['content-type'].startsWith('application/json'))
      badReqAssert(isObject(req.body))
      return handler(view, req.body, req, res, next)
    },
  )

export class StatusError extends Error {
  constructor(code) {
    super(`HTTP Status Code ${code}`)
    this.code = code
  }
}

export const statusError = (code) => {
  throw new StatusError(code)
}

export const badReqAssert = (assertion) => {
  if (!assertion) {
    throw new StatusError(400)
  } else {
    return assertion
  }
}

export const servAssert = (assertion) => {
  if (!assertion) {
    throw new StatusError(500)
  } else {
    return assertion
  }
}

export const typeSortOrder = (v = 'asc') =>
  v === 'asc' || v === 'desc' ? v : null

export const reqSortOrder = (req) => {
  const order = typeSortOrder(req.query.order)
  const reverse = order === 'desc'

  badReqAssert(order !== null)
  return { order, reverse }
}

export const typeOffset = (offset = 0) => {
  if (isString(offset)) {
    offset = Number(offset)
  }

  return Number.isInteger(offset) && offset >= 0 ? offset : null
}

export const typeLimit = (limit) => {
  if (limit === undefined) {
    return undefined
  }

  if (isString(limit)) {
    limit = Number(limit)
  }

  return Number.isInteger(limit) && limit >= 1 ? limit : null
}

export const reqLimitOffset = (req) => {
  const offset = typeOffset(req.query.offset)
  const limit = typeLimit(req.query.limit)

  badReqAssert(offset !== null)
  badReqAssert(limit !== null)

  return { offset, limit }
}
