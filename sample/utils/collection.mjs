import assert from 'node:assert'
import isString from 'lodash/isString.js'
import isNil from 'lodash/isNil.js'
import { UuidBased } from './indexes.mjs'

/**
 * Additive, indexed collection of entities.
 */
export class Collection extends UuidBased
{
  data = []

  ids = new Map()

  indexes = []

  get size() {
    return this.data.length
  }

  add(entity) {
    const index = this.data.length
    const uuid = this.uuid(entity, true)

    assert(
      !this.ids.has(uuid),
      `Entity with same uuid ${uuid} already exists`
    )

    this.ids.set(uuid, index)
    this.data.push(entity)
    this.indexes.forEach(i => i.add(index, entity))

    return index
  }

  getByUuidOrNull(uuid) {
    return this.getByIndex(this.ids.get(uuid))
  }

  getByUuid(uuid, onNotFound) {
    return this.getByIndex(
      this.ids.get(uuid),
      onNotFound ?? (() => {
        throw new Error(`Entity-[${uuid}] is not found`)
      }),
    )
  }

  getByIndex(index, onNotFound) {
    if (!Number.isInteger(index) || index < 0) {
      return onNotFound ? onNotFound() : null
    }

    assert (index < this.data.length)
    return this.data[index]
  }

  merge(delta) {
    const uuid = this.uuid(delta)
    return this.mergeByIndex(this.ids.get(uuid), delta)
  }

  mergeByIndex(index, delta) {
    const source = this.getByIndex(index, () => {
      throw new Error(`Entity-[${this.uuid(delta)}] is not found`)
    })

    return Object.assign(source, delta)
  }

  /**
   * Finds unique entity with the given index id and the index data
   * (part of the entity, or attribute value), and merged delta.
   */
  mergeBySelect(indexId, indexData, delta) {
    assert (isString(indexId))
    return this.mergeByIndex(this.index(indexId).unique(indexData), delta)
  }

  findIndex(id) {
    return this.indexes.find(i => i.id === id)
  }

  getIndex(idOrIndex)
  {
    if (isString(idOrIndex)) {
      const index = this.findIndex(idOrIndex)

      if (!index) {
        throw new Error(`No Index-[${idOrIndex}] found`)
      }

      return index
    }

    assert (idOrIndex instanceof Index)
    assert (isString(idOrIndex.id))

    return idOrIndex
  }

  /**
   * Returns previously registered Index by it's id,
   * or registers a new one instance of Index class.
   */
  index(idOrIndex)
  {
    const index = this.getIndex(idOrIndex)

    if (isString(idOrIndex)) {
      return index
    }

    const indexFound = this.findIndex(index.id)
    if (indexFound === index) {
      return this
    }

    assert (isNil(idOrIndex.collection))
    assert (isNil(index), `Index-[${idOrIndex.id}] already exists`)

    this.indexes.push(idOrIndex)
    idOrIndex.attach(this)

    return this
  }

  toJson(pretty) {
    return JSON.stringify(this.data, undefined, pretty ? 2 : undefined)
  }
}
