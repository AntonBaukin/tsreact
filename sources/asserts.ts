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

export const expectNotNil = <T>(
  item: T | null | undefined,
  msg?: () => string,
): T => {
  if (isNil(item)) {
    const m = msg?.() ?? null

    if (isString(m)) {
      throw Error(m)
    } else {
      throw Error()
    }
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

export const expectString = (item: unknown, msg?: () => string): string => {
  if (!isString(item) || !item.length) {
    const m = msg?.() ?? null

    if (isString(m)) {
      throw Error(m)
    } else {
      throw Error()
    }
  }

  return item
}

export const expectNever = (msg?: () => string): never => {
  const m = msg?.() ?? null

  if (isString(m)) {
    throw Error(m)
  } else {
    throw Error()
  }
}

export const warn = (msg: string) => {
  console.warn(msg)
}

export const expectProps = <T extends {}> (instance?: T) => {
  const proxy = new Proxy({} as T, {
    get(_, prop) {
      const k = expectString(prop) as keyof T & string
      const v = (instance as any)?.[k]

      return expectNotNil(v, () => `Property [${k}] is undefined or null`)
    },

    apply() {
      throw Error()
    },

    set() {
      throw Error()
    },

    deleteProperty() {
      throw Error()
    },

    setPrototypeOf() {
      throw Error()
    },

    defineProperty() {
      throw Error()
    }
  })

  const assign = (t: T | undefined | null) => {
    instance = expectNotNil(t)
  }

  return {
    proxy,
    assign,
    get instance() {
      return instance
    },
  }
}
