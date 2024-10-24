import assert from 'node:assert'
import sortedIndex from 'lodash/sortedIndex'
import isArrayLike from 'lodash/isArrayLike'
import isString from 'lodash/isString'
import isObject from 'lodash/isObject'
import isNil from 'lodash/isNil'

export class UuidBased
{
  uuid(entity, required) {
    const uuid = this.$uuid(entity)

    if (isNil(uuid)) {
      if (required) {
        throw new Error(`Entity has no unique id attribute: ${entity}`)
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
   * @returns array of integer indexes of the entities found
   */
  select(value, hint) {
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
    this.required = !!required
    this.attributeCollector = this.createAttributeCollector(attribute)
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

  select(valueOrEntity, hint) {
    let value = valueOrEntity

    if (isObject(value)) {
      value = this.attributeCollector.collect(value)

      if (isNil(value)) {
        throw new Error(
          `Index-[${this.id}] found no value by attribute "` +
          this.attributeCollector + '" to select in: ' +
          JSON.stringify(valueOrEntity)
        )
      }
    }

    return this.selectValue(value, hint)
  }

  isAddValueAllowed(index, value, entity) {
    return true
  }

  addValue(index, value, entity) {
    throw new Error()
  }

  selectValue(value, hint) {
    throw new Error()
  }
}

export const uniqueIndex = (attribute, required = true) =>
  new UniqueIndex(attribute, attribute, required)

export class UniqueIndex extends AttributeIndex
{
  constructor(id, attribute, required) {
    assert(isString(attribute)) // no multi attributed
    super(id, attribute, required)
  }

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

  selectValue(value) {
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

  /**
   * Maps transformed values to arrays of entities data positions (indexes).
   */
  map = new Map()

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

  selectValue(value, hint = MultiIndex.OR) {
    const tValue = this.attributeCollector.transformValue(value)

    if (isNil(tValue)) {
      return []
    }

    assert (Array.isArray(tValue))
    if (tValue.length === 0) {
      return []
    }

    const tInds = new Map()

    tValue.forEach(tItem => {
      if (!tInds.has(tItem)) {
        tInds.set(tItem, this.map.get(tItem) ?? [])
      }
    })

    return this.$mergeIndexes(tInds, hint)
  }

  $mergeIndexes(tInds, hint) {
    if (tInds.size === 0) {
      return []
    } else if (tInds.size === 1) {
      return tInds.get(tInds.keys().next().value)
    } else {
      return this.$mergeByHint(tInds, hint)
    }
  }

  $mergeByHint(tInds, hint) {
    const manyInds = Array.from(tInds.values())

    if (hint === MultiIndex.OR) {
      return this.$mergeOr(manyInds)
    } else if (hint === MultiIndex.AND) {
      return this.$mergeAnd(manyInds)
    } else {
      return this.$mergeElseHint(manyInds, hint)
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

export class StringsMultiCollector extends AttributeMultiCollector
{
  transformValue(value)
  {
    if (!isString(value)) {
      return []
    }

    const trimmedValue = value.trim()
    if (!trimmedValue.length) {
      return []
    }

    const normalValue = trimmedValue
      .normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLocaleLowerCase()

    return this.splitValue(normalValue)
      .filter(splitItem => this.isItemValid(splitItem))
  }

  $splitPattern = /[\s.,\/#!$%^&*;:{}=\-_`~()]+/

  splitValue(value) {
    return value.split(this.$splitPattern)
  }

  isItemValid(splitItem) {
    return splitItem.length > 1
  }
}

export class StringsIndex extends MultiIndex {
  createAttributeCollector(attribute) {
    return new StringsMultiCollector(attribute)
  }
}

export const stringsSingleIndex = (attribute, required = true) =>
  new StringsIndex(attribute, attribute, required)

export const stringsMultiIndex = (id, attribute, required = true) => {
  assert(Array.isArray(attribute))
  return new StringsIndex(id, attribute, required)
}
