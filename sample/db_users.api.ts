import {
  CountryCode,
  Date,
  Email,
  Entity,
  Phone,
  QueryRange,
} from './api'

export type Gender = 'MALE' | 'FEMALE'

export interface Person extends Entity {
  firstName: string,
  lastName: string,
  dob?: Date,
  email?: Email,
  phone?: Phone,
  gender?: Gender,
  country?: CountryCode,
}

export type PersonsSortOrder = 'name' | 'dob'

export type PersonsQueryRange = QueryRange<PersonsSortOrder>

export interface SearchPersons {
  years?: number[],
  name?: string,
}
