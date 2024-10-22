import assert from 'node:assert'
import isFunction from 'lodash/isFunction.js'
import isString from 'lodash/isString.js'
import isNil from 'lodash/isNil.js'
import { UuidBased, Index } from './indexes.mjs'

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

    this.indexes.forEach(i => i.checkAddAllowed(index, entity))
    this.indexes.forEach(i => i.add(index, entity))

    this.ids.set(uuid, index)
    this.data.push(entity)

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

  /**
   * @param index — number index of data record,
   *   or string id of the unique index reqistered.
   *
   * @param second — optional onNotFound for a number index,
   *   or value to find for a string id of the index.
   *
   * @param third — optional onNotFound for a string id of the index.
   */
  getByIndex(index, second, third) {
    if (isNil(index) || Number.isInteger(index)) {
      if (isNil(index) || index < 0 || index >= this.data.length) {
        if (isNil(second)) {
          return null
        } else {
          assert (isFunction(second))
          return second(index)
        }
      } else {
        return this.data[index]
      }
    }

    assert (isString(index))
    const indexObj = this.getIndex(index)

    function onNotFound() {
      if (isNil(third)) {
        return null
      } else {
        assert (isFunction(third))
        return third(index, second)
      }
    }

    if (isNil(second)) {
      return onNotFound()
    }

    const indexInt = indexObj.uniqueOrNull(second)
    assert (isNil(indexInt) || Number.isInteger(indexInt))

    return this.getByIndex(indexInt, onNotFound)
  }

  /**
   * @param index — string id of index to search in.
   *
   * @param value — value used as the search argument.
   *
   * @param hint — optional hint to pass to the search.
   */
  select(index, value, hint) {
    assert (isString(index))
    const indexObj = this.getIndex(index)

    const inds = indexObj.select(value, hint)
    return inds.map(i => this.getByIndex(i))
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
   * Indexes must be added before the data.
   */
  index(idOrIndex)
  {
    const index = this.getIndex(idOrIndex)

    if (isString(idOrIndex)) {
      return index
    }

    const indexFound = this.findIndex(index.id)
    if (indexFound === index) {
      assert (idOrIndex.collection === this)
      return this
    } else if (indexFound) {
      throw new Error(`Index-[${idOrIndex.id}] already exists`)
    }

    assert (isNil(idOrIndex.collection))
    this.indexes.push(idOrIndex)
    idOrIndex.attach(this)

    return this
  }

  toJson(pretty) {
    return JSON.stringify(this.data, undefined, pretty ? 2 : undefined)
  }
}
