import url from 'node:url'
import path from 'node:path'
import assert from 'node:assert'
import { stringsMultiIndex } from './utils/indexes.mjs'
import { Collection, DataView } from './utils/collection.mjs'
import { readJsonFile } from './utils/json.mjs'

const dbFile = path.format({
  ...path.parse(url.parse(import.meta.url).pathname),
  ext: '.json.gz',
  base: '',
})

/**
 * @returns Promise<Collection> with the users data.
 */
export const readDbUsers = async () => {
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

  await readJsonFile(dbUsers, dbFile, { gz: true })
  assert(dbUsers.size === 100)

  return dbUsers
}

export class UsersView extends DataView
{

}
