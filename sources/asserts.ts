import { isArrayLike, isNil } from './lodash'
import { ArrayLike } from './typing'

export const singleItem = <T>(items: ArrayLike<T>): T => {
  if (!isArrayLike(items)) {
    throw Error()
  }

  if (items.length !== 1) {
    throw Error()
  }

  return items[0]
}

export const expectNotNil = <T>(item: T | null | undefined): T => {
  if (isNil(item)) {
    throw Error()
  }

  return item
}
