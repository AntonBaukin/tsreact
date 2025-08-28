import { describe, expect, test } from '@jest/globals'
import { DataUnit } from './types'
import { makeTestStore, collectingLogger } from './utils.test'

describe('middleware', () => {
  test('register', () => {
    const { registry, registerUnits, defineUnit } = makeTestStore()

    const a = defineUnit({ name: 'A' }).dataUnit
    const b = defineUnit({ name: 'B' }).dataUnit

    registerUnits(a, b)

    expect(registry.get('A')).toBe(a)
    expect(registry.get('B')).toBe(b)
  })

  test('dispatch.twoOnly', () => {
    const { logger, actions  } = collectingLogger()
    const { dispatch, registerUnits, defineUnit } = makeTestStore(logger)
    const a = defineUnit({ name: 'A' }).dataUnit
    const b = defineUnit({ name: 'B' }).dataUnit

    registerUnits(a, b)

    dispatch(a)
    dispatch(b)

    expect(actions).toStrictEqual([{ type: 'A' }, { type: 'B' }])
  })

  test('dispatch.actOnOne', () => {
    const { logger, actions  } = collectingLogger()
    const { dispatch, registerUnits, defineUnit } = makeTestStore(logger)

    const a = defineUnit({ name: 'A' }).dataUnit

    const b = defineUnit({
      name: 'B',

      actsOn: () => [a],

      trigger(this: DataUnit, type: string, _: unknown, unit: DataUnit | undefined) {
        if (type === 'A' && unit?.type === 'A') {
          this.dispatch(this)
        }
      },
    }).dataUnit

    registerUnits(a, b)
    dispatch(a)

    // Dispatch is a synchronous call, and trigger on 'B' in this case runs before
    // passing 'A' to the middleware end. So, we log 'B' before 'A'!

    expect(actions).toStrictEqual([{ type: 'B' }, { type: 'A' }])
  })

  // TODO ... continue to test the units
})
