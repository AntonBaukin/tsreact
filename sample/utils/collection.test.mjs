import { describe, expect, test } from '@jest/globals'
import { Collection } from './collection.mjs'
import {
  AttributeAccess,
  uniqueIndex,
  stringsSingleIndex,
  stringsMultiIndex,
  NumbersIndex,
  DatesIndexClass,
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
      c.add({ uuid: '4', name: 'a' }) // not a unique attribute
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

    const select = (value, hint) =>
      c.select('name', value, hint).map(e => e.uuid).sort()

    expect(select('cortez')).toStrictEqual(['1'])
    expect(select('ali')).toStrictEqual(['1', '2'])
    expect(select('Ben')).toStrictEqual(['1', '2', '3'])

    expect(select('Cortez Atreus')).toStrictEqual(['1', '3'])
    expect(select('ali ben', 'and')).toStrictEqual(['1', '2'])
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

    const select = (value, hint) =>
      c.select('namings', value, hint).map(e => e.uuid).sort()

    expect(select('cortez')).toStrictEqual(['1'])
    expect(select('ali')).toStrictEqual(['1', '2'])
    expect(select('Ben')).toStrictEqual(['1', '2', '3'])

    expect(select('Way')).toStrictEqual(['1', '2', '3'])
    expect(select('Los')).toStrictEqual(['1', '2'])
    expect(select('Los Angeles')).toStrictEqual(['1', '2'])
    expect(select('Los Angeles', 'and')).toStrictEqual(['1'])
  })

  test('numbersIndex', () => {
    const c = new Collection()

    c.index(new NumbersIndex('numbers', ['a', 'b.x', 'b.y']))

    c.add({
      uuid: '1',
      a: 1,
      b: {
        x: 100,
        y: [101, 201],
      },
    })

    c.add({
      uuid: '2',
      a: 2,
      b: [
        { x: 100 },
        { y: 200 },
        { y: 301 },
      ],
    })

    c.add({
      uuid: '3',
      a: 3,
      b: {
        x: 200,
        y: [202, 102],
      },
    })

    c.add({
      uuid: '4',
      a: 4,
      b: {
        x: 300,
        y: [205, 101],
      },
    })

    const select = (value) =>
      c.select('numbers', value).map(e => e.uuid).sort()

    const range = (left, right) =>
      c.range('numbers', left, right).map(e => e.uuid).sort()

    expect(select(1)).toStrictEqual(['1'])
    expect(select(2)).toStrictEqual(['2'])
    expect(select(3)).toStrictEqual(['3'])
    expect(select(4)).toStrictEqual(['4'])

    expect(select(100)).toStrictEqual(['1', '2'])
    expect(select(101)).toStrictEqual(['1', '4'])
    expect(select(102)).toStrictEqual(['3'])

    expect(range(1, 1)).toStrictEqual(['1'])
    expect(range(2, 2)).toStrictEqual(['2'])
    expect(range(3, 3)).toStrictEqual(['3'])
    expect(range(4, 4)).toStrictEqual(['4'])

    expect(range(1, 2)).toStrictEqual(['1', '2'])
    expect(range(1, 3)).toStrictEqual(['1', '2', '3'])
    expect(range(1, 4)).toStrictEqual(['1', '2', '3', '4'])
    expect(range(0, 5)).toStrictEqual(['1', '2', '3', '4'])

    expect(range(100, 100)).toStrictEqual(['1', '2'])
    expect(range(100, 101)).toStrictEqual(['1', '2', '4'])

    expect(range(101, 102)).toStrictEqual(['1', '3', '4'])
    expect(range(201, 204)).toStrictEqual(['1', '3'])
    expect(range(201, 205)).toStrictEqual(['1', '3', '4'])
    expect(range(201, 206)).toStrictEqual(['1', '3', '4'])

    expect(range()).toStrictEqual(['1', '2', '3', '4'])
    expect(range(100)).toStrictEqual(['1', '2', '3', '4'])
    expect(range(300)).toStrictEqual(['2', '4'])
    expect(range(500)).toStrictEqual([])
    expect(range(null, 4)).toStrictEqual(['1', '2', '3', '4'])
    expect(range(null, 3)).toStrictEqual(['1', '2', '3'])
    expect(range(null, 2)).toStrictEqual(['1', '2'])
    expect(range(null, 1)).toStrictEqual(['1'])
    expect(range(null, 0)).toStrictEqual([])
  })

  test('datesIndex', () => {
    const c = new Collection()

    const DatesIndex = DatesIndexClass([
      'YYYY-MM-DDTHH:mm:ssZ[Z]',
      'YYYY-MM-DD',
    ])

    c.index(DatesIndex.createMulti('dates', ['dob']))

    c.add({
      uuid: '1',
      dob: '2006-01-12',
    })

    c.add({
      uuid: '2',
      dob: '1997-07-07',
    })

    c.add({
      uuid: '3',
      dob: '1987-09-21',
    })

    c.add({
      uuid: '4',
      dob: '2000-02-14',
    })

    const select = (value) =>
      c.select('dates', value).map(e => e.uuid).sort()

    const range = (left, right) =>
      c.range('dates', left, right).map(e => e.uuid).sort()

    expect(select('2006-01-12')).toStrictEqual(['1'])
    expect(select('2000-02-14')).toStrictEqual(['4'])

    expect(range('1995-01-01', '2000-12-31')).toStrictEqual(['2', '4'])
    expect(range(null, '2000-12-31')).toStrictEqual(['2', '3', '4'])
    expect(range('1999-01-01')).toStrictEqual(['1', '4'])
  })
})
