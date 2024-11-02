import assert from 'node:assert'
import dayjs from 'dayjs'
import {
  isArrayLike,
  isString,
  isObject,
  isNil,
  sortedIndex,
  sortedIndexBy,
  sortedLastIndexBy,
} from './lodash.mjs'

export class UuidBased
{
  uuid(entity, required) {
    const uuid = this.$uuid(entity)

    if (isNil(uuid)) {
      if (required) {
        throw new Error(
          'Entity has no unique id attribute: ' +
          JSON.stringify(entity)
        )
      }

      return null
    }

    if (!isString(uuid)) {
      throw new Error(`Entity unique id attribute is not a string: ${uuid}`)
    }

    return uuid
  }

  $uuid(entity) {
    return entity.uuid
  }
}

/**
 * Abstract parent class of a collection index.
 */
export class Index extends UuidBased
{
  /**
   * String id of this index.
   * Used to name and find index instances.
   */
  id

  constructor(id) {
    super()
    assert (isString(id) && id.length)
    this.id = id
  }

  attach(collection) {
    assert (isNil(this.collection))
    this.collection = collection
  }

  /**
   * @returns true — allowed, false — not allowed,
   *   string — not allowed with this cause
   */
  isAddAllowed(index, entity) {
    return true
  }

  checkAddAllowed(index, entity) {
    const check = this.isAddAllowed(index, entity)
    if (check === true) {
      return true
    }

    if (isString(check)) {
      throw new Error(check)
    }

    assert (check === false)
    throw new Error(`Add entity at index-[${index}] is not allowed: ${entity}`)
  }

  add(index, entity) {
    throw new Error()
  }

  /**
   * @param value the value of the attribute to search.
   *
   * @param hint — additional parameter dependend on the index type.
   *
   * @returns array of integer indexes of the entities found.
   */
  select(value, hint) {
    throw new Error()
  }

  /**
   * Variant of select() for indexes with order that support
   * ranged selection: [left; right], right — inclusive.
   *
   * Left, right, or even both, may be null: in this case
   * left means the leading, right means the last element.
   */
  range(left, right) {
    throw new Error()
  }

  /**
   * Returns unique, required entity index.
   */
  unique(value) {
    const result = this.uniqueOrNull(value)

    if (isNil(result)) {
      throw new Error(
        `No entity is found in Index-[${this.id}] by "${value}"`
      )
    }

    return result
  }

  uniqueOrNull(value) {
    const result = this.select(value)

    if (result.length === 0) {
      return null
    }

    if (result.length > 1) {
      throw new Error(
        `Not unique entity is found in Index-[${this.id}] by "${value}"`
      )
    }

    return result[0]
  }
}

/**
 * Strategy to collect one or multiple attributes from object entities.
 * The path is a string attributes joined with '.' — like for lodash.get().
 *
 * If intermediate value is array-like, and the following path element
 * is not an integer index — the traverse is spawn for each element,
 * and the access result is always an array.
 *
 * Examples: 'some'. 'some.nested', and
 *  'some.array.0.name' — returns the name of zero entity, but
 *  'some.array.name' — returns all the names (array).
 *
 * Note, that negative index takes items from the tail, i.e. '.-1' —
 * takes the last item of the array-like.
 */
export class AttributeAccess
{
  constructor(path) {
    assert(isString(path) && path.length)
    this.items = this.$split(path)
  }

  access(entity) {
    return this.$collect(entity, 0)
  }

  /**
   * If the path is plain, returns null — to use lodash#get() directly.
   * Else, return an array of AttributeAccess instances to chain the access.
   */
  $split(path) {
    return path.split('.').filter(s => s.length).map(s => this.$parse(s))
  }

  $parse(item) {
    const i = Number(item)

    if (Number.isInteger(i)) {
      return { i }
    } else {
      return item
    }
  }

  // Depends on parsed format (except string keys).
  $accessBy(target, item) {
    const { i } = item
    assert(Number.isInteger(i))

    if (!isAnArray(target)) {
      return null
    }

    if (i >= 0) {
      return i < target.length ? target[i] : null
    } else {
      const j = target.length + i
      return j >= 0 ? target[j] : null
    }
  }

  // Recursive traverser & collector by the path items:
  $collect(target, index) {
    if (isNil(target) || index >= this.items.length) {
      return target
    }

    const item = this.items[index]

    if (!isString(item)) {
      return this.$collect(this.$accessBy(target, item), index + 1)
    }

    if (isAnArray(target)) {
      const entries = Array.isArray(target) ? target : Array.from(target)
      if (!Array.isArray(entries)) {
        return null
      }

      const result = []

      for (const e of entries) {
        const nested = this.$collect(e, index)
        if (!isNil(nested)) {
          result.push(nested)
        }
      }

      return result
    } else if (isObject(target)) {
      return this.$collect(target[item], index + 1)
    } else {
      return null
    }
  }

  toString() {
    return this.items.join('.')
  }
}

const isAnArray = (x) => Array.isArray(x) || (isArrayLike(x) && !isString(x))

/**
 * Constructed with a single attribute path — see AttributeAccess.
 */
export class AttributeCollector
{
  constructor(attribute) {
    if (isString(attribute)) {
      assert(attribute.length)
    } else {
      assert(Array.isArray(attribute) && attribute.length)
      attribute.forEach((a) => {
        assert(isString(a) && a.length)
      })
    }

    this.attribute = attribute
  }

  get isMulti() {
    return Array.isArray(this.attribute)
  }

  collect(entity) {
    if (isNil(entity)) {
      return null
    }

    if (isString(this.attribute)) {
      return this.collectOne(entity, this.attribute)
    }

    const result = []
    this.attribute.forEach(a => {
      const v = this.collectOne(entity, a)

      if (Array.isArray(v)) {
        v.forEach(x => !isNil(x) && result.push(x))
      } else if (!isNil(v)) {
        result.push(v)
      }
    })

    return result.length ? result : null
  }

  collectOne(entity, path) {
    return this.$accessor(path).access(entity)
  }

  $accessors = new Map()

  $accessor(path) {
    let accessor = this.$accessors.get(path)

    if (!accessor) {
      accessor = this.$createAccessor(path)
      this.$accessors.set(path, accessor)
    }

    return accessor
  }

  $createAccessor(path) {
    return new AttributeAccess(path)
  }

  toString() {
    return this.isMulti ? this.attribute.join(', ') : this.attribute
  }
}

/**
 * Abstract class of indexes by a single attribute,
 * or an array of attributes (for multi-indexes).
 */
export class AttributeIndex extends Index
{
  constructor(id, attribute, required) {
    super(id)
    this.attribute = attribute
    this.required = !!required
  }

  get isMulti() {
    return this.attributeCollector.isMulti
  }

  isAddAllowed(index, entity) {
    const value = this.attributeCollector.collect(entity)

    if (isNil(value)) {
      if (this.required) {
        return this.$requiredErrorText(entity)
      } else {
        return true // allowed (to skip)
      }
    }

    if (this.isMulti) {
      assert(Array.isArray(value))

      for (const v of value) {
        if (this.isAddValueAllowed(index, v, entity)) {
          // At least one attribute value is allowed to index:
          return true
        }
      }

      return false
    } else {
      return this.isAddValueAllowed(index, value, entity)
    }
  }

  get attributeCollector() {
    if (!this.$attributeCollector) {
      this.$attributeCollector = this.createAttributeCollector(this.attribute)
    }
    return this.$attributeCollector
  }

  createAttributeCollector(attribute) {
    return new AttributeCollector(attribute)
  }

  $requiredErrorText(entity) {
    return `Entity-[${this.uuid(entity)}] has no attribute: ` +
      this.attributeCollector
  }

  add(index, entity) {
    const value = this.attributeCollector.collect(entity)

    if (isNil(value)) {
      if (this.required) {
        throw new Error(this.$requiredErrorText(entity))
      } else {
        return
      }
    }

    if (this.isMulti) {
      assert(Array.isArray(value))
      value.forEach(v => this.addValue(index, v, entity))
    } else {
      this.addValue(index, value, entity)
    }
  }

  isAddValueAllowed(index, value, entity) {
    return true
  }

  addValue(index, value, entity) {
    throw new Error()
  }
}

export class SingleIndex extends AttributeIndex
{
  constructor(id, attribute, required) {
    assert(isString(attribute)) // no multi attributed
    super(id, attribute, required)
  }

  get isMulti() {
    return false
  }
}

export const uniqueIndex = (attribute, required = true) =>
  new UniqueIndex(attribute, attribute, required)

export class UniqueIndex extends SingleIndex
{
  /**
   * Maps indexed values to entities data positions (indexes).
   */
  map = new Map()

  isAddValueAllowed(index, value, entity) {
    if (this.map.has(value)) {
      return this.$notUniqueErrorText(entity, value)
    } else {
      return true
    }
  }

  $notUniqueErrorText(entity, value) {
    return (
      `Entity-[${this.uuid(entity)}]-[${this.attributeCollector}] ` +
      `is not unique in Index-[${this.id}]: ${value}`
    )
  }

  addValue(index, value, entity) {
    if (this.map.has(value)) {
      throw new Error(this.$notUniqueErrorText(entity, value))
    } else {
      this.map.set(value, index)
    }
  }

  select(value) {
    const index = this.map.get(value)
    return isNil(index) ? [] : [index]
  }
}

export class AttributeMultiCollector extends AttributeCollector
{
  constructor(attribute) {
    super(isString(attribute) ? [attribute] : attribute)
  }

  get isMulti() {
    return true
  }

  /**
   * Transforms a value to the index map keys.
   * The same keys are created when collecting entity attributes.
   *
   * @returns an array of value split items, or null.
   */
  transformValue(value) {
    return isNil(value) ? null : Array.isArray(value) ? value : [value]
  }
}

export class MultiIndex extends AttributeIndex
{
  /**
   * Select hint for split values.
   * Intersects resulting indexes for each value item.
   */
  static AND = 'and'

  /**
   * Select hint for split values.
   * Unites resulting indexes for each value item.
   */
  static OR = 'or'

  get isMulti() {
    return true
  }

  createAttributeCollector(attribute) {
    return new AttributeMultiCollector(attribute)
  }

  isAddValueAllowed(_index, value, _entity) {
    const tValue = this.attributeCollector.transformValue(value)

    if (isNil(tValue)) {
      return false
    } else {
      assert(Array.isArray(tValue))
      return tValue.length !== 0
    }
  }

  addValue(index, value, entity) {
    const tValue = this.attributeCollector.transformValue(value)

    if (!isNil(tValue)) {
      assert(Array.isArray(tValue))
      tValue.forEach(this.addOne.bind(this, index))
    }
  }

  addOne(index, tItem) {
    throw new Error()
  }

  select(value, hint = MultiIndex.OR) {
    const tValue = this.$tValue(value)
    if (isNil(tValue)) {
      return []
    }

    const tInds = new Map()
    tValue.forEach(tItem => {
      if (!tInds.has(tItem)) {
        tInds.set(tItem,  this.getOne(tItem) ?? [])
      }
    })

    return this.$mergeIndexes(Array.from(tInds.values()), hint)
  }

  /**
   * Returns
   */
  $tValue(value) {
    if (isNil(value)) {
      return null
    }

    const tValue = this.attributeCollector.transformValue(value)
    if (isNil(tValue)) {
      return null
    }

    assert(Array.isArray(tValue))
    return tValue.length ? tValue : null
  }

  range(left, right) {
    const tLeft = this.$tValue(left)
    const tRight = this.$tValue(right)
    let tInds = null

    if (isNil(tLeft) && isNil(tRight)) {
      tInds = this.$rangeFull()
    } else if (isNil(tLeft)) {
      assert(Array.isArray(tRight) && tRight.length)
      tInds = this.$rangeTo(tRight)
    } else if (isNil(tRight)) {
      assert(Array.isArray(tLeft) && tLeft.length)
      tInds = this.$rangeFrom(tLeft)
    } else {
      assert(Array.isArray(tLeft) && tLeft.length)
      assert(Array.isArray(tRight) && tRight.length)
      tInds = this.$rangeFromTo(tLeft, tRight)
    }

    return this.$mergeRangeIndexes(tInds)
  }

  /**
   * @param tLeft — array of values to search from — take the smallest.
   *
   * @param tRight — array of values to search to — take the largest.
   *
   * @returns array of arrays of collection indexes to OR-merge them.
   */
  $rangeFromTo(tLeft, tRight) {
    throw new Error()
  }

  $rangeFrom(tLeft) {
    throw new Error()
  }

  $rangeTo(tRight) {
    throw new Error()
  }

  $rangeFull() {
    throw new Error()
  }

  /**
   * @returns entity index array by the given item
   *   of the transformed query value.
   */
  getOne(tItem) {
    throw new Error()
  }

  /**
   * @param tInds — array of arrays of collection position indexes
   *  to merge into single array by the hint method.
   *
   * @param hint — how to merge: OR, AND, etc.
   */
  $mergeIndexes(tInds, hint) {
    if (!tInds?.length) {
      return []
    } else if (tInds.length === 1) {
      return tInds[0]
    } else {
      return this.$mergeByHint(tInds, hint)
    }
  }

  $mergeRangeIndexes(tInds) {
    return this.$mergeIndexes(tInds, MultiIndex.OR)
  }

  $mergeByHint(tInds, hint) {
    if (hint === MultiIndex.OR) {
      return this.$mergeOr(tInds)
    } else if (hint === MultiIndex.AND) {
      return this.$mergeAnd(tInds)
    } else {
      return this.$mergeElseHint(tInds, hint)
    }
  }

  $mergeOr(manyInds) {
    const all = new Set()

    manyInds.forEach(inds => {
      inds.forEach(i => all.add(i))
    })

    return Array.from(all)
  }

  $mergeAnd(manyInds) {
    let every = []

    manyInds.forEach((inds, i) => {
      if (i === 0) {
        every = inds
      } else {
        const indsSet = new Set(inds)
        every = every.filter(i => indsSet.has(i))
      }
    })

    return every
  }

  $mergeElseHint(manyInds, hint) {
    throw new Error(`Unknown multi index select hint "${hint}"`)
  }
}

export class MultiMapIndex extends MultiIndex
{
  /**
   * Maps transformed values to arrays of entities data positions (indexes).
   */
  map = new Map()

  addOne(index, tItem) {
    assert (!isNil(tItem))
    const entry = this.map.get(tItem)

    if (entry) {
      const i = sortedIndex(entry, index)
      if (entry[i] !== index) {
        entry.splice(index, 0, index)
      }
    } else {
      this.map.set(tItem, [index])
    }
  }

  getOne(tItem) {
    return this.map.get(tItem)
  }
}

export class StringsCollector extends AttributeMultiCollector
{
  transformValue(value)
  {
    if (!isString(value)) {
      return null
    }

    const trimmedValue = value.trim()
    if (!trimmedValue.length) {
      return null
    }

    const normalValue = trimmedValue
      .normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLocaleLowerCase()

    const result = this.splitValue(normalValue)
      .filter(splitItem => this.isItemValid(splitItem))

    return result.length ? result : null
  }

  $splitPattern = /[\s.,\/#!$%^&*;:{}=\-_`~()]+/

  splitValue(value) {
    return value.split(this.$splitPattern)
  }

  isItemValid(splitItem) {
    return splitItem.length > 1
  }
}

export class StringsIndex extends MultiMapIndex {
  createAttributeCollector(attribute) {
    return new StringsCollector(attribute)
  }
}

export const stringsSingleIndex = (attribute, required = false) => {
  assert(isString(attribute))
  return new StringsIndex(attribute, attribute, required)
}

export const stringsMultiIndex = (id, attribute, required = false) => {
  assert(Array.isArray(attribute))
  return new StringsIndex(id, attribute, required)
}

/**
 * Attribute value is somehow transformed to a comparable value
 * that is associated with one or more collection indexes.
 */
export class SortedIndex extends MultiIndex
{
  /**
   * Each items of this array is an array of the following format:
   * [ value, ... index entries ] — leading value is mapped
   * with this sparse collection.
   */
  entries = []

  addOne(index, tItem) {
    const entry = this.$entry(tItem, true)

    // Note that $index — is integer value of the collection insert
    // position, thus it may be equal to $tItem located as 0-item
    // of index entry: [ tItem, ... collection indexes ... ].
    if (entry.lastIndexOf(index) > 0) {
      return // duplicate
    }

    entry.push(index)
  }

  getOne(tItem) {
    const entry = this.$entry(tItem, true)
    return entry ? entry.slice(1) : null
  }

  $entry(tItem, insert) {
    const e = [tItem]
    const i = this.$sortedIndexBy(e)
    const l = this.entries.length

    assert(i >= 0)
    assert(i <= l)

    if (i === l || (!i && !l)) {
      if (insert) {
        this.entries.push(e)
        return e
      } else {
        return null
      }
    } else {
      const x = this.entries[i]

      if (this.$equal(tItem, x[0])) {
        return x
      } else if (insert) {
        this.entries.splice(i, 0, e)
        return e
      } else {
        return null
      }
    }
  }

  $equal(aItem, bItem) {
    return aItem === bItem
  }

  $rangeFromTo(tLeft, tRight) {
    const left = this.$tMin(tLeft)
    const iLeft = this.$iRangeLeft(left)
    const right = this.$tMax(tRight)
    const iRight = this.$iRangeRight(right)
    return this.$rangeCollectInds(iLeft, iRight)
  }

  $tMin(tValue) {
    assert(Array.isArray(tValue) && tValue.length)
    return tValue.sort()[0]
  }

  $iRangeLeft(left) {
    return this.$sortedIndexBy([left])
  }

  $tMax(tValue) {
    assert(Array.isArray(tValue) && tValue.length)
    return tValue.sort()[tValue.length - 1]
  }

  $iRangeRight(right) {
    return this.$sortedLastIndexBy([right]) - 1
  }

  $rangeCollectInds(iLeft, iRight) {
    const l = this.entries.length
    assert(iLeft >= 0 && iLeft <= l)
    assert(iRight >= -1 && iRight <= l) // note -1

    if (iLeft === l || iLeft > iRight) {
      return null
    }

    const result = new Array(iRight - iLeft + 1)
    for (let i = iLeft; i <= iRight; i++) {
      result.push(this.entries[i].slice(1))
    }

    return result
  }

  $rangeFrom(tLeft) {
    const left = this.$tMin(tLeft)
    const iLeft = this.$iRangeLeft(left)
    return this.$rangeCollectInds(iLeft, this.entries.length - 1)
  }

  $rangeTo(tRight) {
    const right = this.$tMax(tRight)
    const iRight = this.$iRangeRight(right)
    return this.$rangeCollectInds(0, iRight)
  }

  $rangeFull() {
    return this.$rangeCollectInds(0, this.entries.length - 1)
  }

  $sortedIndexBy(entryCandidate) {
    return sortedIndexBy(this.entries, entryCandidate, (x) => x[0])
  }

  $sortedLastIndexBy(entryCandidate) {
    return sortedLastIndexBy(this.entries, entryCandidate, (x) => x[0])
  }
}

export class NumbersCollector extends AttributeMultiCollector
{
  /**
   * Tells whether this collector allows integer numbers only
   * (default), or also a float point numbers.
   */
  get isIntegerOnly() {
    return true
  }

  transformValue(value) {
    const n = this.transformValueToNumber(value)

    if (this.isIntegerOnly) {
      return Number.isInteger(n) ? [n] : null
    } else {
      return Number.isFinite(n) ? [n] : null
    }
  }

  transformValueToNumber(value) {
    return value
  }
}

export class NumbersIndex extends SortedIndex {
  createAttributeCollector(attribute) {
    return new NumbersCollector(attribute)
  }
}

/**
 * Converts date or time strings according to Day.js format.
 * Format may be given as a string, array of strings to match the first.
 */
export class DatesCollector extends NumbersCollector
{
  constructor(attribute, format) {
    super(attribute)

    if (Array.isArray(format)) {
      format.forEach(f => assert(isString(f)))
    } else {
      assert(isString(format))
    }

    this.format = format
  }

  transformValueToNumber(value) {
    if (!isString(value)) {
      return null
    }

    if (Array.isArray(this.format)) {
      for (const f of this.format) {
        const d = this.parseDate(f, value)
        if (d) {
          return d
        }
      }

      return null
    } else {
      return this.parseDate(this.format, value)
    }
  }

  /**
   * @returns Unix timestamp (milliseconds), or null.
   */
  parseDate(format, value) {
    const d = dayjs(value, format)
    return d.isValid() ? d.valueOf() : null
  }
}

/**
 * @param format — see DatesCollector.
 */
export const DatesIndexClass = (format) => {
  class DatesIndex extends SortedIndex {
    createAttributeCollector(attribute) {
      return new DatesCollector(attribute, format)
    }
  }

  DatesIndex.createSingle = (attribute, required = false) => {
    assert(isString(attribute))
    return new DatesIndex(attribute, attribute, required)
  }

  DatesIndex.createMulti = (id, attribute, required = false) => {
    assert(Array.isArray(attribute))
    return new DatesIndex(id, attribute, required)
  }

  return DatesIndex
}

