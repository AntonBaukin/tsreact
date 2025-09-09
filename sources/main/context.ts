import { makeAppContext } from 'sources/app'
import { appLinker } from 'sources/app/withApp'
import { makeUnitsRegistry, unitUtilities } from 'sources/unit'
import { fetchUnitUnitilties } from 'sources/fetch'
import { getStore, addMiddleware, installReducer } from './store/create'

const appContext = makeAppContext(getStore)
const registry = makeUnitsRegistry(appContext)
const { withApp, useAppContext } = appLinker(appContext)
const registerUnits = registry.register.bind(registry)

addMiddleware(registry.middleware)
installReducer(registry.reducer)

const uu = unitUtilities(appContext)

const {
  defineUnit,
  defineOnlyUnit,
  defineGlobalUnit,
  defineSliceUnit,
  defineOwnUnit,
} = uu

const {
  defineFetchUnit,
} = fetchUnitUnitilties(appContext, uu)

export {
  withApp,
  useAppContext,
  registerUnits,
  defineUnit,
  defineOnlyUnit,
  defineGlobalUnit,
  defineSliceUnit,
  defineOwnUnit,
  defineFetchUnit,
}
