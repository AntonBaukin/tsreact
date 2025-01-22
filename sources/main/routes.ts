import { Route } from 'sources/co/utils/routing'

const routes = [
  {
    id: 'about',
    path: '/',
    default: true,
    title: 'pages.about',
  },
  {
    id: 'search',
    path: '/search',
    title: 'pages.search',
  },
] as const

export type RouteKey = typeof routes[number]['id']

export default () => routes as readonly Route<RouteKey>[]
