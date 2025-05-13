import { FC } from 'react'

export interface Route<Id extends string> {
  id: Id,
  path: string,
  component: FC,
  // Lang constant with the page title, or just a string:
  title: string,
  children?: Route<Id>[],
}

export type Routes<Id extends string> = readonly Route<Id>[]
