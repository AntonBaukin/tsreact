import url from 'node:url'
import path from 'node:path'
import assert from 'node:assert'
import { DatesIndexClass, stringsMultiIndex } from './utils/indexes.mjs'
import { Collection, DataView } from './utils/collection.mjs'
import { readJsonFile } from './utils/json.mjs'
import { orderBy, orderByDate, orderByString } from './utils/orderBy.mjs'
import { trPick } from './utils/transform.mjs'

const dbFile = path.format({
  ...path.parse(url.parse(import.meta.url).pathname),
  ext: '.json.gz',
  base: '',
})

/**
 * @returns Promise<Collection> with the users data.
 */
export const readDbUsers = async () => {
  const YearIndex = DatesIndexClass('YYYY-MM-DD')
  const dbUsers = new Collection()

  dbUsers.index(
    stringsMultiIndex('name', ['firstName', 'lastName'])
  )

  dbUsers.index(
    stringsMultiIndex('address', [
      'address.city',
      'address.street',
      'address.postcode',
      'billing.city',
      'billing.street',
      'billing.postcode',
    ])
  )

  dbUsers.index(YearIndex.createSingle('dob'))

  await readJsonFile(dbUsers, dbFile, { gz: true })
  assert(dbUsers.size === 100)

  return dbUsers
}

export class PersonsView extends DataView
{
  buildIndexes() {
  }

  buildOrders() {
    const orderByLastFirstName = orderBy('lastName', orderByString())
      .with(orderBy('firstName', orderByString()))

    const orderByDobYearName =
      orderBy('dob', orderByDate('YYYY-MM-DD', d => d.year()))
        .with(orderByLastFirstName)

    this.orderCmp('lastFirstName', orderByLastFirstName)
    this.orderBy('dobYearName', orderByDobYearName)
  }

  buildTransforms() {
    return trPick([
      'uuid',
      'lastName',
      'firstName',
      'dob',
      'email',
      'phone',
      'gender',
      'country',
    ])
  }

  /**
   * @param sort = 'dob' | (* =) 'name'
   */
  selectByName(name, sort) {
    sort = sort === 'dob' ? 'dobYearName' : 'lastFirstName'
    return name?.trim().length
      ? this.select('name', name, sort, 'and')
      : this.all('name', sort)
  }

  /**
   * @param sort = (* =) 'dob' | 'name'
   */
  selectByDob(name, years, sort) {
    sort = sort === 'name' ? 'lastFirstName' : 'dobYearName'

    const isName = name?.trim().length
    const isYears = years?.length

    if (!isName && !isYears) {
      return this.all('dob', sort)
    }

    let rInds = []
    let nInds = []

    if (isName) {
      nInds = this.selectIndex('name', name, 'and')
      if (!isYears) {
        rInds = nInds
      }
    }

    if (isYears) {
      years.forEach(year => {
        const yInds = this.rangeIndex('dob', `${year}-01-01`, `${year}-12-31`)
        const nyInds = isName ? this.andIndex(nInds, yInds) : yInds
        rInds = this.orIndex(rInds, nyInds)
      })
    }

    const result = this.mapIndex(rInds)
    return this.sort(sort, result)
  }
}
