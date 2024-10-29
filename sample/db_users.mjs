import url from 'node:url'
import path from 'node:path'
import assert from 'node:assert'
import { Collection } from './utils/collection.mjs'
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

  await readJsonFile(dbUsers, dbFile, { gz: true })
  assert(dbUsers.size === 100)

  return dbUsers
}
