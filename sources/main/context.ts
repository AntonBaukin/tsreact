import { appLinker, makeAppContext } from 'sources/app'
import { makeUnitsRegistry, unitMakers } from 'sources/unit'
import { getStore, AppState, AppDispatch, addMiddleware, installReducer } from './store'
import * as units from 'sources/main/units'

const appContext = makeAppContext(getStore)
const registry = makeUnitsRegistry(appContext)
const { defineUnit } = unitMakers<AppState, AppDispatch>()
const { withApp, useAppContext } = appLinker(appContext)
const registerUnits = registry.register.bind(registry)

addMiddleware(registry.middleware)
installReducer(registry.reducer)

export {
  withApp,
  useAppContext,
  registerUnits,
  defineUnit,
}
