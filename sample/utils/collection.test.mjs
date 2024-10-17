import { describe, expect, test } from '@jest/globals'
import { Collection } from './collection.mjs'

describe('collection.basics', () => {
  test('addEntities', () => {
    const c = new Collection()

    c.add({ uuid: '1', name: 'a' })
    c.add({ uuid: '2', name: 'b' })
    c.add({ uuid: '3', name: 'c' })

    expect(c.size).toBe(3)

    expect(c.getByUuid('1')).toHaveProperty('name', 'a')
    expect(c.getByUuid('2')).toHaveProperty('name', 'b')
    expect(c.getByUuid('3')).toHaveProperty('name', 'c')

    expect(c.getByUuidOrNull('X')).toBeNull()
    expect(() => c.getByUuid('X')).toThrow('Entity-[X] is not found')
  })

})
