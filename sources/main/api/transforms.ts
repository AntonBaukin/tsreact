import dayjs from 'sources/dayjs'
import { isString, isNil } from 'sources/lodash'
import { asTransform, autoTransformSimple } from 'sources/fetch'
import { CountryCode, Gender, Person } from './types'

const trUuid = asTransform<string>((x: any) => {
  if (isString(x)) {
    if (x.match(uuidRegex)) {
      return x
    } else {
      throw Error('not an uuid')
    }
  } else {
    throw Error('not a string (uuid)')
  }
})

const uuidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-5][0-9a-fA-F]{3}-[089abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/

const trDate = asTransform<string | undefined>((x: any) => {
  if (isNil(x)) {
    return undefined
  }

  if (isString(x)) {
    if (!x) {
      return undefined
    }

    if (dayjs(x, "YYYY-MM-DD", true).isValid()) {
      return x
    } else {
      throw Error('invalid YYYY-MM-DD date')
    }
  } else {
    throw Error('not a string (date)')
  }
})

const trGender = asTransform<Gender | undefined>((x: any) => {
  if (isNil(x)) {
    return undefined
  }

  if (x === 'MALE' || x === 'FEMALE') {
    return x
  } else {
    throw Error('not a valid Gender')
  }
})

const trCountryCode = asTransform<CountryCode | undefined>((x: any) => {
  if (isNil(x)) {
    return undefined
  }

  if (isString(x) && x.length === 2 && x.toUpperCase() === x) {
    return x
  } else {
    throw Error('not a valid country code')
  }
})

export const trPerson = autoTransformSimple<Person>(self => ({
  uuid: trUuid,
  firstName: self.$string,
  lastName: self.$string,
  dob: trDate,
  email: self.$stringOptional,
  phone: self.$stringOptional,
  gender: trGender,
  country: trCountryCode,
}))
