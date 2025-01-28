import { isArrayLike, isString, isNil } from './lodash'
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

export const expectTrue = (item: unknown, msg?: () => string) => {
  if (item !== true) {
    const m = msg?.() ?? null

    if (isString(m)) {
      throw Error(m)
    } else {
      throw Error()
    }
  }
}

export const expectString = (item: unknown, msg?: () => string) => {
  if (!isString(item) || !item.length) {
    const m = msg?.() ?? null

    if (isString(m)) {
      throw Error(m)
    } else {
      throw Error()
    }
  }
}

export const expectNever = (msg?: () => string): never => {
  const m = msg?.() ?? null

  if (isString(m)) {
    throw Error(m)
  } else {
    throw Error()
  }
}
