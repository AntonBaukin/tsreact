import assert from 'node:assert'
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

  add(index, entity) {
    throw new Error()
  }

  /**
   * @param value the value of the attribute to search
   * @returns array of integer indexes of the entities found
   */
  select(value) {
    throw new Error()
  }

  /**
   * Returns unique, required entity index.
   */
  unique(value) {
    const result = this.select(value)

    if (result.length === 0) {
      throw new Error(
        `No entity is found in Index-[${this.id}] by "${value}"`
      )
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

  add(index, entity) {
    const value = entity[this.attribute]

    if (isNil(value)) {
      if (this.required) {
        throw new Error(
          `Entity-[${this.uuid(entity)}] has no attribute "${this.attribute}"`
        )
      }

      return
    }

    this.addValue(index, value, entity)
  }

  select(valueOrObject) {
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

    return this.selectValue(value)
  }

  addValue(index, value, entity) {
    throw new Error()
  }

  selectValue(value) {
    throw new Error()
  }
}

export const uniqueIndex = (id, attribute, required) =>
  new UniqueIndex(id, attribute, required)

export const uniqueAttrIndex = (attribute, required) =>
  new UniqueIndex(attribute, attribute, required)

export class UniqueIndex extends AttributeIndex
{
  /**
   * Maps indexed values to entities data positions (indexes).
   */
  map = new Map()

  addValue(index, value, entity) {
    if (this.map.has(value)) {
      throw new Error(
        `Entity-[${this.uuid(entity)}]-[${this.attribute}] ` +
        `is not unique in Index-[${this.id}]: ${value}`
      )
    }

    this.map.set(value, index)
  }

  selectValue(value) {
    const index = this.map.get(value)

    if (isNil(index)) {
      throw new Error(`Index-[${this.id}] has no value: ${value}`)
    }

    return [index]
  }
}
