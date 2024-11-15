import { CountryCode, Date, Email, Entity, Phone, SortOrder, Sorted, Slice } from './api'

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

export interface GetAllPersons extends Slice, Sorted<PersonsSortOrder> {
  years?: number[],
  name?: string,
}

export interface SearchPersons {
  years?: number[],
  name?: string,
}

export interface PostSearchPersons extends Slice, Sorted<PersonsSortOrder> {
  body: SearchPersons,
}
