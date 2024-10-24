import { describe, expect, test } from '@jest/globals'
import { Collection } from './collection.mjs'
import {
  AttributeAccess,
  uniqueIndex,
  stringsSingleIndex,
  stringsMultiIndex,
} from './indexes.mjs'

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

  test('stringsSingleIndex', () => {
    const c = new Collection()
    c.index(stringsSingleIndex('name'))

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

  test('AttributeAccess', () => {
    const entity = {
      name: 'a',
      nested: {
        scope: 'b',
        items: [
          { indexes: [1, 2, 3] },
          { indexes: [4, 5, 6] },
          { indexes: [7, 8, 9] },
        ],
      },
      indexes: [1, 2, 3],
      items: [
        { name: 'x' },
        { name: 'y' },
        { name: 'z' },
      ],
    }

    const access = (path) => new AttributeAccess(path).access(entity)

    expect(access('name')).toBe('a')
    expect(access('indexes')).toStrictEqual([1, 2, 3])
    expect(access('indexes.0')).toBe(1)
    expect(access('indexes.-1')).toBe(3)
    expect(access('items.name')).toStrictEqual(['x', 'y', 'z'])
    expect(access('nested.scope')).toBe('b')
    expect(access('nested.items.-2.indexes.1')).toBe(5)
    expect(access('nested.items.indexes.0')).toStrictEqual([1, 4, 7])
    expect(access('nested.items.indexes'))
      .toStrictEqual([[1, 2, 3], [4, 5, 6], [7, 8, 9]])
  })

  test('stringsMultiIndex', () => {
    const c = new Collection()

    c.index(
      stringsMultiIndex('namings', [
        'name',
        // Works both, with address arrays, or single objects:
        'address.city',
        'address.street',
      ])
    )

    c.add({
      uuid: '1',
      name: 'Amari Cortéz Ben Ali',
      address: [
        { city: 'Los Angeles', street: 'Cherry Way' },
        { city: 'Pasadena', street: 'Thirteenth Route' },
      ],
    })

    c.add({
      uuid: '2',
      name: 'Ali ben-Abdiel',
      address: { city: 'Los Gatos', street: 'Eagle Way' },
    })

    c.add({
      uuid: '3',
      name: 'Atreus Ben`ton',
      address: [
        { city: 'Topanga', street: 'Hillcrest Path' },
        { city: 'Maywood', street: 'Spring Way' },
      ],
    })

    const selectUuids = (value, hint) =>
      c.select('namings', value, hint).map(e => e.uuid).sort()

    expect(selectUuids('cortez')).toStrictEqual(['1'])
    expect(selectUuids('ali')).toStrictEqual(['1', '2'])
    expect(selectUuids('Ben')).toStrictEqual(['1', '2', '3'])

    expect(selectUuids('Way')).toStrictEqual(['1', '2', '3'])
    expect(selectUuids('Los')).toStrictEqual(['1', '2'])
    expect(selectUuids('Los Angeles')).toStrictEqual(['1', '2'])
    expect(selectUuids('Los Angeles', 'and')).toStrictEqual(['1'])
  })
})
