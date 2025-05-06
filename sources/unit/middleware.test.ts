import { describe, expect, test } from '@jest/globals'
import { noop } from 'sources/lodash'
import { DataUnit } from './types'
import { makeTestRegistry, collectingLogger } from './utils.test'

describe('middleware', () => {
  test('register', () => {
    const { registry, defineUnit } = makeTestRegistry(noop)
    const a = defineUnit({ name: 'A' }).dataUnit
    const b = defineUnit({ name: 'B' }).dataUnit

    registry.register(a, b)

    expect(registry.get('A')).toBe(a)
    expect(registry.get('B')).toBe(b)
  })

  test('dispatch.twoOnly', () => {
    const { log, units } = collectingLogger()
    const { dispatch, registry, defineUnit } = makeTestRegistry(log)
    const a = defineUnit({ name: 'A' }).dataUnit
    const b = defineUnit({ name: 'B' }).dataUnit

    registry.register(a, b)

    dispatch(a)
    dispatch(b)

    expect(units).toStrictEqual([a, b])
  })

  test('dispatch.actOnOne', () => {
    const { log, units } = collectingLogger()
    const { dispatch, registry, defineUnit } = makeTestRegistry(log)
    const a = defineUnit({ name: 'A' }).dataUnit

    const b = defineUnit({
      name: 'B',

      actsOn: () => [a],

      trigger(this: DataUnit, type: string, _p: unknown, unit: DataUnit | undefined) {
        if (type === 'A' && unit?.type === 'A') {
          this.dispatch(this)
        }
      },
    }).dataUnit

    registry.register(a, b)
    dispatch(a)

    // Dispatch is a synchronous call, and trigger on 'B' in this case runs before
    // passing 'A' to the middleware end. So, we log 'B' before 'A'!

    expect(units).toStrictEqual([b, a])
  })

})
