import assert from 'node:assert'
import dayjs from './dayjs.mjs'
import { get, isNil, isString, isFunction } from './lodash.mjs'

/**
 * @param format — full format of the income values.
 * @param asInt — optional function taking valid Day.js object,
 *   and returning number to compare.
 */
export const orderByDate = (format = 'YYYY-MM-DD', asNumber) => {
  return (a, b) => {
    const aD = dayjs(a, format)
    const bD = dayjs(b, format)

    if (aD.isValid() && bD.isValid()) {
      return asNumber
        ? asNumber(aD) - asNumber(bD)
        : aD.valueOf() - bD.valueOf()
    } else if (aD.isValid()) {
      return -1
    } else if (bD.isValid()) {
      return +1
    } else {
      return 0
    }
  }
}

export const orderByDateTime = (format = 'YYYY-MM-DDTHH:mm:ss.SSSZ') => {
  return orderByDate(format)
}

export const orderByString = (
  locales,
  options = {
    ignorePunctuation: true,
    sensitivity: 'base',
    numeric: true,
  },
) => {
  return (a, b) => {
    const aS = isString(a)
    const bS = isString(b)

    if (aS && bS) {
      return a.localeCompare(b, locales, options)
    } else if (aA) {
      return -1
    } else if (bS) {
      return +1
    } else {
      return 0
    }
  }
}

export const orderBy = (path, cmp, nullsFirst = false) => {
  return new OrderBy(path, cmp, nullsFirst)
}

export class OrderBy
{
  constructor(path, cmp, nullsFirst) {
    assert(isString(path))
    this.path = path

    assert(isFunction(cmp))
    this.cmp = cmp

    assert(nullsFirst === true || nullsFirst === false)
    this.nullsFirst = nullsFirst
  }

  get comparator() {
    if (!this.$comparator) {
      this.$comparator = this.makeComparator()
    }
    return this.$comparator
  }

  makeComparator() {
    return makeOrderByComparator(this)
  }

  with(orderBy) {
    assert(isFunction(orderBy) || orderBy instanceof OrderBy)
    return joinComparators(
      this.comparator,
      isFunction(orderBy) ? orderBy : orderBy.comparator,
    )
  }
}

const makeOrderByComparator = ({ path, cmp, nullsFirst }) => {
  return (a, b) => {
    const aV = get(a, path)
    const aN = isNil(aV)
    const bV = get(b, path)
    const bN = isNil(bV)

    if (aN || bN) {
      if (aN || bN) {
        return 0
      } else if (aN) {
        return nullsFirst ? -1 : +1
      } else if (bN) {
        return nullsFirst ? +1 : -1
      }
    } else {
      return cmp(aV, bV)
    }
  }
}

const joinComparators = (first, second) => {
  return (a, b) => {
    const cmpFirst = first(a, b)

    if (cmpFirst !== 0) {
      return cmpFirst
    } else {
      return second(a, b)
    }
  }
}
