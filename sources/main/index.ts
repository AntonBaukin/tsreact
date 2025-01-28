import { composeReactBoot, withRoot } from 'sources/co/Root'
import { makeAppContext, appLinker } from 'sources/app'
import { withScreen } from 'sources/co/Screen'
import { initUnitsRegistry } from 'sources/unit'
import { withStore, getStore, addMiddleware } from './store'
import * as units from './units'
import Main from './Main'

const appContext = makeAppContext(getStore)
const { withApp, useAppContext } = appLinker(appContext)

const registry = initUnitsRegistry(appContext, units)
addMiddleware(registry.middleware)

export { useAppContext }

export default composeReactBoot (
  Main,
  withStore,
  withApp,
  withRoot,
  withScreen,
)
