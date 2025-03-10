import { appLinker, makeAppContext } from 'sources/app'
import { makeUnitsRegistry, unitUtilities } from 'sources/unit'
import { getStore, addMiddleware, installReducer } from './store/create'

const appContext = makeAppContext(getStore)
const registry = makeUnitsRegistry(appContext)
const { withApp, useAppContext } = appLinker(appContext)
const registerUnits = registry.register.bind(registry)

addMiddleware(registry.middleware)
installReducer(registry.reducer)

const {
  defineUnit,
  defineOnlyUnit,
  defineGlobalUnit,
  defineSliceUnit,
  defineOwnUnit,
} = unitUtilities(appContext)

export {
  withApp,
  useAppContext,
  registerUnits,
  defineUnit,
  defineOnlyUnit,
  defineGlobalUnit,
  defineSliceUnit,
  defineOwnUnit,
}
