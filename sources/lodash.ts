import isArrayLike from 'lodash/isArrayLike'
import isFunction from 'lodash/isFunction'
import isBoolean from 'lodash/isBoolean'
import isObject from 'lodash/isObject'
import isString from 'lodash/isString'
import isEqual from 'lodash/isEqual'
import isEmpty from 'lodash/isEmpty'
import isNil from 'lodash/isNil'
import get from 'lodash/get'
import set from 'lodash/set'
import noop from 'lodash/noop'
import omit from 'lodash/omit'
import pick from 'lodash/pick'
import template from 'lodash/template'
import throttle from 'lodash/throttle'
import cloneDeep from 'lodash/cloneDeep'

export {
  isArrayLike,
  isFunction,
  isBoolean,
  isObject,
  isString,
  isEqual,
  isEmpty,
  isNil,
  get,
  set,
  noop,
  omit,
  pick,
  template,
  throttle,
  cloneDeep,
}

const isDiffTarget = (some: unknown) => isObject(some) || isArrayLike(some)

export const deepDiff = (prev: any, next: any) => {
  let diff: any = isArrayLike(prev) ? [] : {}

  for (const key in prev) {
    if (Object.prototype.hasOwnProperty.call(prev, key)) {
      if (!Object.prototype.hasOwnProperty.call(next, key)) {
        diff[key] = undefined // Property removed
      } else if (!isEqual(prev[key], next[key])) {
        if (isDiffTarget(prev[key]) && isDiffTarget(next[key])) {
          const nestedDiff = deepDiff(prev[key], next[key])
          if (!isEmpty(nestedDiff)) {
            diff[key] = nestedDiff
          }
        } else {
          diff[key] = next[key] // Property value changed
        }
      }
    }
  }

  for (const key in next) {
    if (
      Object.prototype.hasOwnProperty.call(next, key) &&
      !Object.prototype.hasOwnProperty.call(prev, key)
    ) {
      diff[key] = next[key] // Property added
    }
  }

  return isEmpty(diff) ? undefined : diff
}
