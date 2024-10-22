import assert from 'node:assert'
import sortedIndex from 'lodash/sortedIndex.js'
import isString from 'lodash/isString.js'
import isObject from 'lodash/isObject.js'
import isNil from 'lodash/isNil.js'

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
 * Abstract class of indexes by a single attribute.
 */
export class AttributeIndex extends Index
{
  constructor(id, attribute, required) {
    super(id)

    assert(isString(attribute) && attribute.length)
    this.attribute = attribute
    this.required = !!required
  }

  isAddAllowed(index, entity) {
    const value = entity[this.attribute]

    if (isNil(value)) {
      if (this.required) {
        return this.$requiredErrorText(entity)
      } else {
        return true // allowed
      }
    }

    return this.isAddValueAllowed(index, value, entity)
  }

  $requiredErrorText(entity) {
    return `Entity-[${this.uuid(entity)}] has no attribute "${this.attribute}"`
  }

  add(index, entity) {
    const value = entity[this.attribute]

    if (isNil(value)) {
      if (this.required) {
        throw new Error(this.$requiredErrorText(entity))
      } else {
        return
      }
    }

    this.addValue(index, value, entity)
  }

  select(valueOrObject, hint) {
    let value = valueOrObject

    if (isObject(value)) {
      value = value[this.attribute]

      if (isNil(value)) {
        throw new Error(
          `Index-[${this.id}] has no select value "${this.attribute}" in: ` +
          JSON.stringify(valueOrObject)
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
      `Entity-[${this.uuid(entity)}]-[${this.attribute}] ` +
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

  /**
   * Transforms a value to the index map key.
   * May return an array of value split items.
   */
  transformValue(value) {
    return value
  }

  isAddValueAllowed(_index, value, _entity) {
    const tValue = this.transformValue(value)
    return Array.isArray(tValue) ? tValue.length !== 0 : !isNil(tValue)
  }

  addValue(index, value, entity) {
    const tValue = this.transformValue(value)

    const addOne = (tItem) => {
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

    if (Array.isArray(tValue)) {
      assert (tValue.length !== 0)
      tValue.forEach(addOne)
    } else {
      addOne(tValue)
    }
  }

  selectValue(value, hint = MultiIndex.OR) {
    const tValue = this.transformValue(value)

    if (Array.isArray(tValue)) {
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
    } else {
      const result = isNil(tValue) ? null : this.map.get(tValue)
      return isNil(result) ? [] : Array.from(tValue)
    }
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

export class StringsIndex extends MultiIndex
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

export const stringsIndex = (attribute, required = true) =>
  new StringsIndex(attribute, attribute, required)
