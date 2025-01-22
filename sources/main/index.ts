import { composeReactBoot, withRoot } from 'sources/co/Root'
import { makeAppContext, appLinker } from 'sources/app'
import { withScreen } from 'sources/co/Screen'
import { withStore, getStore } from './store'
import Main from './Main'

const appContext = makeAppContext(getStore)
const { withApp, useAppContext } = appLinker(appContext)

export { useAppContext }

export default composeReactBoot (
  Main,
  withStore,
  withApp,
  withRoot,
  withScreen,
)
