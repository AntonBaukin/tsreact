import { describe, expect, test } from '@jest/globals'
import { Collection } from './collection.mjs'
import { uniqueIndex, stringsIndex } from './indexes.mjs'

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

  test('getByUniqueIndex', () => {
    const c = new Collection()
    c.index(uniqueIndex('name'))

    c.add({ uuid: '1', name: 'a' })
    c.add({ uuid: '2', name: 'b' })
    c.add({ uuid: '3', name: 'c' })

    expect(() => {
      c.add({ uuid: '4', name: 'a' }) // not unique attribute
    }).toThrow('Entity-[4]-[name] is not unique in Index-[name]: a')

    expect(c.size).toBe(3)

    expect(c.getByIndex('name', 'a')).toHaveProperty('uuid', '1')
    expect(c.getByIndex('name', 'b')).toHaveProperty('uuid', '2')
    expect(c.getByIndex('name', 'c')).toHaveProperty('uuid', '3')

    expect(c.getByIndex('name', 'd', () => 'X')).toBe('X')
    expect(c.getByIndex('name', 'e')).toBeNull()
  })

  test('stringsIndex', () => {
    const c = new Collection()
    c.index(stringsIndex('name'))

    c.add({ uuid: '1', name: 'Amari Cortéz Ben Ali' })
    c.add({ uuid: '2', name: 'Ali ben-Abdiel' })
    c.add({ uuid: '3', name: 'Atreus Ben`ton' })

    const selectUuids = (value, hint) =>
      c.select('name', value, hint).map(e => e.uuid).sort()

    expect(selectUuids('cortez')).toStrictEqual(['1'])
    expect(selectUuids('ali')).toStrictEqual(['1', '2'])
    expect(selectUuids('Ben')).toStrictEqual(['1', '2', '3'])

    expect(selectUuids('Cortez Atreus')).toStrictEqual(['1', '3'])
    expect(selectUuids('ali ben', 'and')).toStrictEqual(['1', '2'])
  })
})
