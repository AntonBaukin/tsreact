import { describe, expect, test } from '@jest/globals'
import { readDbUsers, PersonsView } from './db_users.mjs'

const dbUsers = await readDbUsers()

const sUuid = (e) => e.uuid.substring(0, 8)
const pName = (p) => `${p.lastName} ${p.firstName}`

describe('dbUsers.persons', () => {
  const pView = new PersonsView(dbUsers)

  test('allByName', () => {
    const persons = pView.selectByName()
    expect(persons).toHaveLength(100)
    expect(pName(persons[0])).toBe('Allison Amiyah')
    expect(pName(persons[99])).toBe('Zhang Samara')
  })

  test('searchByName', () => {
    const uName = p => `${sUuid(p)} ${pName(p)}`
    const select = name => pView.selectByName(name).map(uName)

    expect(select('Rosa')).toStrictEqual([
      '8708553c Li Rosa',
      '2b6b609a Morrow Rosa',
    ])

    expect(select('Neal')).toStrictEqual([
      '2afd9bfa Neal Emiliano',
      '5e885122 Neal Grant',
    ])

    expect(select('Stone')).toStrictEqual([
      'df6f4e32 Stone Armani',
      '3d471e5b Stone Harlan',
    ])
  })

  test('allByDob', () => {
    const persons = pView.selectByDob()
    const pYear = p => p.dob.substring(0, 4)
    const dobName = p => `${pYear(p)} ${pName(p)}`

    expect(persons).toHaveLength(100)
    expect(dobName(persons[10])).toBe('1991 Huff Yisroel')
    expect(dobName(persons[50])).toBe('1999 West Uriel')
    expect(dobName(persons[90])).toBe('2006 Zavala Aitana')
  })

  test('searchByDob', () => {
    const pYear = p => p.dob.substring(0, 4)
    const dobName = (p, i) => `${pYear(p)} ${pName(p)}`
    const select = (name, years) =>
      pView.selectByDob(name, years).map(dobName)

    expect(select(null, [1997, 2003])).toStrictEqual([
      '1997 Davila Saint',
      '1997 Golden Bianca',
      '1997 Jacobs Halo',
      '2003 Rosas Adaline',
      '2003 Stephens Olivia',
      '2003 Stout Flynn',
      '2003 Vasquez Jaliyah',
    ])

    expect(select('Neal', [1996])).toStrictEqual([
      '1996 Neal Grant'
    ])

    expect(select('Stone', [2001])).toStrictEqual([
      '2001 Stone Armani'
    ])
  })

  test('prepare.transform', () => {
    const select = name => pView.prepare(pView.selectByName(name))

    expect(select('Neal Emiliano')).toStrictEqual([
      {
        uuid: '2afd9bfa-c12e-4ce1-9872-813ac7b8c8d8',
        firstName: 'Emiliano',
        lastName: 'Neal',
        dob: '1986-10-29',
        email: 'neal_emiliano@yahoo.com',
        phone: '+1-909-939-2746',
        gender: 'MALE',
        country: 'US'
      }
    ])
  })

  test('prepare.slice', () => {
    const pYear = p => p.dob.substring(0, 4)
    const dobName = p => `${pYear(p)} ${pName(p)}`
    const select = (years, options) =>
      pView.prepare(pView.selectByDob(null, years), options).map(dobName)

    expect(select([1988, 1990])).toStrictEqual([
      '1988 French Josiah',
      '1988 Todd Thomas',
      '1990 Benton Atreus',
      '1990 Dunn Roberto',
      '1990 Zamora Ali',
    ])

    expect(select([1988, 1990], { reverse: true })).toStrictEqual([
      '1990 Zamora Ali',
      '1990 Dunn Roberto',
      '1990 Benton Atreus',
      '1988 Todd Thomas',
      '1988 French Josiah',
    ])

    expect(select([1990, 1991, 1992], { offset: 5 }))
      .toStrictEqual([
        '1991 Vang Baylor',
        '1991 Wilkinson Callen',
        '1992 Barron Clay',
        '1992 Blair Lennox',
      ])

    expect(select([1990, 1991, 1992], { offset: 5, reverse: true }))
      .toStrictEqual([
        '1991 Duncan Lyle',
        '1990 Zamora Ali',
        '1990 Dunn Roberto',
        '1990 Benton Atreus',
      ])

    expect(select([1990, 1991, 1992], { offset: 2, limit: 3 }))
      .toStrictEqual([
        '1990 Zamora Ali',
        '1991 Duncan Lyle',
        '1991 Huff Yisroel',
      ])

    expect(select([1990, 1991, 1992], { offset: 2, limit: 3, reverse: true }))
      .toStrictEqual([
        '1991 Wilkinson Callen',
        '1991 Vang Baylor',
        '1991 Huff Yisroel',
      ])
  })
})
