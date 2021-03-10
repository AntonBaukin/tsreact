import { Reducer, Store, Middleware } from 'redux'

export function createAppStore(reducer: Reducer, ...middleware: Middleware[]): Store
