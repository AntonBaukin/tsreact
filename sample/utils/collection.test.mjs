import { describe, expect, test } from '@jest/globals'
import { Collection, DataView } from './collection.mjs'
import { orderBy, orderByString, orderByDate } from './orderBy.mjs'
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
      'YYYY-MM-DDTHH:mm:ss.SSSZ',
      'YYYY-MM-DD',
    ])

    c.index(DatesIndex.createMulti('dates', [
      'dob',
      'registration.createdAt',
    ]))

    c.add({
      uuid: '1',
      dob: '2006-01-12',
      registration: {
        createdAt: '2024-10-01T22:25:120.749Z',
      }
    })

    c.add({
      uuid: '2',
      dob: '1997-07-07',
      registration: {
        createdAt: '2024-10-04T12:16:11.210Z',
      }
    })

    c.add({
      uuid: '3',
      dob: '1987-09-21',
      registration: {
        createdAt: '2024-10-03T05:21:30.358Z',
      }
    })

    c.add({
      uuid: '4',
      dob: '2000-02-14',
      registration: {
        createdAt: '2024-10-02T10:52:10.768Z',
      }
    })

    const select = (value) =>
      c.select('dates', value).map(e => e.uuid).sort()

    const range = (left, right) =>
      c.range('dates', left, right).map(e => e.uuid).sort()

    expect(select('2006-01-12')).toStrictEqual(['1'])
    expect(select('2000-02-14')).toStrictEqual(['4'])

    expect(range('1995-01-01', '2000-12-31')).toStrictEqual(['2', '4'])
    expect(range(null, '2000-12-31')).toStrictEqual(['2', '3', '4'])
    expect(range('2024-10-03')).toStrictEqual(['2', '3'])

    expect(
      range(
        '2024-10-01T23:30:00.00Z',
        '2024-10-03T01:15:00.000Z',
      ),
    ).toStrictEqual(['4'])
  })
})

describe('collection.dataViews', () => {
  const c = new Collection()

  c.add({
    uuid: '1',
    lastName: 'Miles',
    firstName: 'Jaiden',
    dob: '1998-10-24',
    address: {
      city: 'Los Compton',
    },
  })

  c.add({
    uuid: '2',
    lastName: 'Burns',
    firstName: 'Esteban',
    dob: '1987-09-21',
    address: {
      city: 'Los Angeles',
    },
  })

  c.add({
    uuid: '3',
    lastName: 'Smith',
    firstName: 'Leona',
    dob: '2006-02-22',
    address: {
      city: 'Los Angeles',
    },
  })

  c.add({
    uuid: '4',
    lastName: 'Solomon',
    firstName: 'Joe',
    dob: '2006-02-14',
    address: {
      city: 'Santa Clara',
    },
  })

  c.add({
    uuid: '5',
    lastName: 'Solomon',
    firstName: 'Jazmine',
    dob: '1995-02-22',
    address: {
      city: 'Los Angeles',
    },
  })

  class PersonsView extends DataView
  {
    buildIndexes() {
      const DatesIndex = DatesIndexClass('YYYY-MM-DD')

      this.collection.index(
        stringsMultiIndex('name', ['lastName', 'firstName'])
      )

      this.collection.index(
        stringsMultiIndex('address', ['address.city'])
      )

      this.collection.index(
        DatesIndex.createSingle('dob')
      )
    }

    buildOrders() {
      const orderByLastFirstName = orderBy('lastName', orderByString())
        .with(orderBy('firstName', orderByString()))

      const orderByAddressName = orderBy('address.city', orderByString())
        .with(orderByLastFirstName)

      const orderByDobYearName = orderBy('dob', orderByDate('YYYY'))
        .with(orderByLastFirstName)

      this.orderCmp('lastFirstName', orderByLastFirstName)
      this.orderCmp('addressName', orderByAddressName)
      this.orderBy('dob', orderByDate())
      this.orderBy('dobYearName', orderByDobYearName)
    }

    selectAllPersons() {
      return this.all('name', 'lastFirstName')
    }

    selectAllPersonDobs() {
      return this.all('dob', 'dob')
    }

    findByAddress(address) {
      return this.select('address', address, 'addressName')
    }

    findByAddressExact(address) {
      return this.select('address', address, 'addressName', 'and')
    }

    rangeByDob(first, last) {
      return this.range('dob', first, last, 'lastFirstName')
    }

    findPersonsWithAddress(name, address) {
      const pInds = this.selectIndex('name', name)
      const aInds = this.selectIndex('address', address)
      const xInds = this.andIndex(pInds, aInds)
      const result = this.mapIndex(xInds, true)
      return this.sort('addressName', result)
    }

    findPersonsByDobYears(name, years) {
      let ysInds = []

      years.forEach(year => {
        const yInds = this.rangeIndex('dob', `${year}-01-01`, `${year}-12-31`)
        ysInds = this.orIndex(ysInds, yInds)
      })

      const pInds = this.selectIndex('name', name)
      const xInds = this.andIndex(pInds, ysInds)
      const result = this.mapIndex(xInds, true)
      return this.sort('dobYearName', result)
    }
  }

  const v = new PersonsView(c)

  test('orderByString', () => {
    expect(
      v.selectAllPersons()
        .map(e => `${e.uuid}: ${e.lastName} ${e.firstName}`)
    ).toStrictEqual([
      '2: Burns Esteban',
      '1: Miles Jaiden',
      '3: Smith Leona',
      '5: Solomon Jazmine',
      '4: Solomon Joe',
    ])
  })

  test('orderByDate', () => {
    expect(
      v.selectAllPersonDobs()
        .map(e => `${e.uuid}: ${e.dob} ${e.firstName}, ${e.lastName}`)
    ).toStrictEqual([
      '2: 1987-09-21 Esteban, Burns',
      '5: 1995-02-22 Jazmine, Solomon',
      '1: 1998-10-24 Jaiden, Miles',
      '4: 2006-02-14 Joe, Solomon',
      '3: 2006-02-22 Leona, Smith',
    ])
  })

  test('select', () => {
    expect(
      v.findByAddress('los').map(
        e => `${e.uuid}: ${e.address.city} — ${e.firstName}, ${e.lastName}`
      )
    ).toStrictEqual([
      '2: Los Angeles — Esteban, Burns',
      '3: Los Angeles — Leona, Smith',
      '5: Los Angeles — Jazmine, Solomon',
      '1: Los Compton — Jaiden, Miles',
    ])
  })

  test('selectAnd', () => {
    expect(
      v.findByAddressExact('los angeles').map(
        e => `${e.uuid}: ${e.address.city} — ${e.lastName} ${e.firstName}`
      )
    ).toStrictEqual([
      '2: Los Angeles — Burns Esteban',
      '3: Los Angeles — Smith Leona',
      '5: Los Angeles — Solomon Jazmine',
    ])
  })

  test('rangeOne', () => {
    expect(
      v.rangeByDob('2006-02-01', '2006-03-01')
        .map(e => `${e.uuid}: ${e.lastName} ${e.firstName}: ${e.dob}`)
    ).toStrictEqual([
      '3: Smith Leona: 2006-02-22',
      '4: Solomon Joe: 2006-02-14',
    ])
  })

  test('andSearch', () => {
    expect(
      v.findPersonsWithAddress('Solomon', 'Santa Clara').map(
        e => `${e.uuid}: ${e.address.city} — ${e.lastName} ${e.firstName}`
      )
    ).toStrictEqual([
      '4: Santa Clara — Solomon Joe',
    ])
  })

  test('orSearch', () => {
    expect(
      v.findPersonsByDobYears('Solomon', [1995, 2006]).map(e =>
        `${e.dob.substring(0, 4)}: ${e.uuid} — ${e.lastName} ${e.firstName}`
      )
    ).toStrictEqual([
      '1995: 5 — Solomon Jazmine',
      '2006: 4 — Solomon Joe',
    ])
  })
})
