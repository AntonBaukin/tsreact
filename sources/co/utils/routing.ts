import { expectNotNil, singleItem } from 'sources/asserts'

export interface Route<Key extends string> {
  id: Key,
  path: string,
  default?: true,
  // Lang constant with the page title:
  title: string,
}

export type Routes<Key extends string> = readonly Route<Key>[]

export type GetRoutes<Key extends string> = () => Routes<Key>

export const findDefaultRoute = <Key extends string>(routes: GetRoutes<Key>) => {
  const found = routes().filter(r => r.default)
  return singleItem(found)
}

export const findRoute = <Key extends string>(routes: GetRoutes<Key>, key: string) =>
  expectNotNil(routes().find(r => r.id === key))
