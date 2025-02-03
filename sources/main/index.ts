import { composeReactBoot, withRoot } from 'sources/co/Root'
import { withScreen } from 'sources/co/Screen'
import { withStore } from './store'
import { withApp, registerUnits } from './context'
import * as units from './units'
import Main from './Main'

registerUnits(units)

export default composeReactBoot (
  Main,
  withStore,
  withApp,
  withRoot,
  withScreen,
)
