import assert from 'node:assert'
import { isNil, isObject, isFunction, pick, omit } from './lodash.mjs'

export class Transform {
  transform(entity) {
    return entity
  }
}

export const IdentityTransform = new Transform()

export class TrWrap extends Transform
{
  constructor(trFunction) {
    super()
    assert(isFunction(trFunction))
    this.trFunction = trFunction
  }

  transform(entity) {
    return this.trFunction(entity)
  }
}

export const trWrap = (tr) => {
  if (isFunction(tr)) {
    return new TrWrap(tr)
  } else {
    assert(tr instanceof Transform)
    return tr
  }
}

export class JoinTransforms extends Transform
{
  constructor(transforms) {
    super()
    assert(Array.isArray(transforms))
    transforms.forEach(tr => assert(tr instanceof Transform))
    this.transforms = transforms
  }

  transform(entity) {
    let result = entity

    for (const tr of this.transforms) {
      result = tr.transform(result)
    }

    return result
  }
}

export const trJoin = (transforms) => {
  if (isNil(transforms)) {
    return IdentityTransform
  }

  if (transforms instanceof Transform) {
    return transforms
  }

  if (isFunction(transforms)) {
    return trWrap(transforms)
  }

  assert(Array.isArray(transforms))
  if (!transforms.length) {
    return IdentityTransform
  } else if (transforms.length === 1) {
    return trWrap(transforms[0])
  } else {
    return new JoinTransforms(transforms.map(trWrap))
  }
}

export class TrObject extends Transform
{
  transform(entity) {
    if (isNil(entity)) {
      return entity
    } else if (!isObject(entity)) {
      return undefined
    } else {
      return this.trObject(entity)
    }
  }

  trObject(entity) {
    return entity
  }
}

export class TrObjectPaths extends TrObject {
  constructor(paths) {
    super()
    assert(Array.isArray(paths))
    this.paths = paths
  }
}

export class TrPick extends TrObjectPaths {
  trObject(entity) {
    return pick(entity, this.paths)
  }
}

export const trPick = (paths) => {
  const picker = new TrPick(paths)
  return entity => picker.transform(entity)
}

export class TrOmit extends TrObjectPaths {
  trObject(entity) {
    return omit(entity, this.paths)
  }
}

export const trOmit = (paths) => {
  const omitter = new TrOmit(paths)
  return entity => omitter.transform(entity)
}
