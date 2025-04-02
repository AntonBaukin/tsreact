import { describe, expect, test } from '@jest/globals'
import { noop } from 'sources/lodash'
import { makeTestRegistry, collectingLogger } from './utils.test'

describe('registry', () => {
  test('register.simple', () => {
    const { registry, defineUnit } = makeTestRegistry(noop)
    const a = defineUnit({ name: 'A' }).dataUnit
    const b = defineUnit({ name: 'B' }).dataUnit

    registry.register(a, b)
    expect(registry.get('A')).toBe(a)
    expect(registry.get('B')).toBe(b)
  })

  test('dispatch.simple', () => {
    const { log, units, actions } = collectingLogger()
    const { registry, dispatch, defineUnit } = makeTestRegistry(log)
    const a = defineUnit({ name: 'A' }).dataUnit
    const b = defineUnit({ name: 'B' }).dataUnit

    dispatch(a)
    dispatch(b)
    expect(units).toStrictEqual([a, b])
    expect(actions).toStrictEqual([{ type: 'A' }, { type: 'B' }])
  })
})
