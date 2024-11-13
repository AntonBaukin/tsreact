import assert from 'node:assert'
import { isFunction, isString, isNil } from './lodash.mjs'
import { UuidBased, Index } from './indexes.mjs'
import { Transform, trJoin } from './transform.mjs'
import { OrderBy } from './orderBy.mjs'

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
    const inds = this.selectIndex(index, value, hint)
    return inds.map(i => this.getByIndex(i))
  }

  selectIndex(index, value, hint) {
    assert (isString(index))
    const indexObj = this.getIndex(index)
    return indexObj.select(value, hint)
  }

  /**
   * @see Index.range()
   */
  range(index, left, right) {
    const inds = this.rangeIndex(index, left, right)
    return inds.map(i => this.getByIndex(i))
  }

  rangeIndex(index, left, right) {
    assert (isString(index))
    const indexObj = this.getIndex(index)
    return indexObj.range(left, right)
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

    // Add all existing entities to the new index:
    this.data.forEach((e, i) => idOrIndex.add(i, e))

    return this
  }
}

/**
 * Strategy to select and order data from the given collection.
 */
export class DataView
{
  constructor(collection) {
    assert(collection instanceof Collection)
    this.collection = collection
    this.transform = trJoin(this.buildTransforms())
    this.buildIndexes()
    this.buildOrders()
  }

  /**
   * Adds indexes to the collection that are specific for this view.
   */
  buildIndexes() {
  }

  buildOrders() {
  }

  /**
   * @returns an array of Transform instances to apply.
   */
  buildTransforms() {
    return null
  }

  find(uuid) {
    return this.collection.getByUuidOrNull(uuid)
  }

  orders = new Map()

  /**
   * Registers an order strategy that is able to compare entities.
   */
  orderBy(id, orderBy) {
    assert(isFunction(orderBy) || orderBy instanceof OrderBy)
    this.orders.set(id, orderBy)
  }

  /**
   * Registers an order strategy that is able to compare attribute
   * values by the given path, if defined, or by itself.
   *
   * @param cmp — standard compare function of attribute values.
   */
  orderCmp(id, cmp, path = null, nullsFirst = false) {
    assert(isString(id))
    assert(isFunction(cmp))
    assert(isString(path) || isNil(path))

    this.orders.set(
      id,
      isNil(path) ? cmp : new OrderBy(path, cmp, nullsFirst),
    )
  }

  /**
   * Returns entities by the given array of indexes.
   *
   * @param inds — integer positions of intities in the collection
   *   (returned by a query to index).
   *
   * @param unique — whether the index value dublicates are evicted;
   *   also: nulls are not included in the result.
   */
  mapIndex(inds, unique = false) {
    assert(Array.isArray(inds))

    if (unique) {
      const indexesSet = new Set()
      return inds.flatMap((index) => {
        if (isNil(index)) {
          return []
        } else {
          assert(Number.isInteger(index) && index >= 0)

          if(indexesSet.has(index)) {
            return []
          } else {
            indexesSet.add(index)

            const e = this.collection.getByIndex(index)
            return isNil(e) ? [] : [e]
          }
        }
      })
    } else {
      return inds.map((index) => {
        if (isNil(index)) {
          return null
        } else {
          assert(Number.isInteger(index) && index >= 0)
          return this.collection.getByIndex(index)
        }
      })
    }
  }

  /**
   * Sorts in-place the array of entities by the registered order.
   */
  sort(orderId, entities) {
    assert(Array.isArray(entities))

    const orderBy = this.orders.get(orderId)
    assert(isFunction(orderBy) || orderBy instanceof OrderBy)

    entities.sort(isFunction(orderBy) ? orderBy : orderBy.comparator)
    return entities
  }

  get(uuid) {
    return this.collection.getByUuidOrNull(uuid)
  }

  select(index, value, orderId, hint) {
    const entities = this.collection.select(index, value, hint)
    return isNil(orderId) ? entities : this.sort(orderId, entities)
  }

  selectIndex(index, value, hint) {
    return this.collection.selectIndex(index, value, hint)
  }

  range(index, left, right, orderId) {
    const entities = this.collection.range(index, left, right)
    return isNil(orderId) ? entities : this.sort(orderId, entities)
  }

  rangeIndex(index, left, right) {
    return this.collection.rangeIndex(index, left, right)
  }

  all(index, orderId) {
    return this.range(index, null, null, orderId)
  }

  /**
   * Returns A-array leaving only index positions that
   * are not present in B-array — ANDs two selects.
   */
  andIndex(indsA, indsB) {
    assert(Array.isArray(indsA))
    assert(Array.isArray(indsB))

    if (!indsA.length || !indsB.length) {
      return []
    }

    if (indsA.length < indsB.length) {
      [indsB, indsA] = [indsA, indsB]
    }

    const setB = new Set(indsB)
    return indsA.filter(i => setB.has(i))
  }

  /**
   * Returns A-array adding all index positions that
   * are present only in B-array — ORs two selects.
   * Dublicates in B-array are not checked.
   */
  orIndex(indsA, indsB) {
    assert(Array.isArray(indsA))
    assert(Array.isArray(indsB))

    if (!indsA.length) {
      return indsB
    } else if (!indsB.length) {
      return indsA
    }

    if (indsA.length > indsB.length) {
      [indsB, indsA] = [indsA, indsB]
    }

    const setA = new Set(indsA)
    for (const i of indsB) {
      if (!setA.has(i)) {
        indsA.push(i)
      }
    }

    return indsA
  }

  /**
   * Prepares the entities from the selection to return
   * them to the querying client.
   *
   * Warning! Initial array of entities is modified!
   *
   * @param entities — array of the selected entities to prepare.
   *
   * @param offset — integer number of the selection offset, * = 0.
   *
   * @param limit — limit of the entities, * = all
   *
   * @param reverse — true, to in-place reverse
   */
  prepare(entities, { offset, limit, reverse, transform = true } = {})
  {
    assert(Array.isArray(entities))

    let result = entities
    let begin = offset
    let end = entities.length // exclusive

    if (isNil(offset)) {
      begin = 0
    } else {
      assert(Number.isInteger(offset))
      assert(offset >= 0)
    }

    if (!isNil(limit)) {
      assert(Number.isInteger(limit))
      assert(limit >= 0)
      end = offset + limit
    }

    if (end > entities.length) {
      end = entities.length
    }

    if (begin >= end) {
      return []
    }

    // Apply the reverse before in-place transformation:
    if (reverse) {
      entities.reverse()
    }

    if (transform) {
      const tr = this.transform.transform.bind(this.transform)
      let insertIndex = begin

      for (let sourceIndex = begin; sourceIndex < end; sourceIndex++) {
        const source = entities[sourceIndex]
        const transformed = tr(source)

        if (!isNil(transformed)) {
          entities[insertIndex++] = transformed
        }
      }

      end = insertIndex
      if (begin >= end) {
        return []
      }
    }

    if (begin === 0 && end === entities.length) {
      return entities
    } else {
      return entities.slice(begin, end)
    }
  }
}
