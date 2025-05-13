import { composeReactBoot, withRoot } from 'sources/co/Root'
import { routeObjects, withRouting } from 'sources/co/Routing'
import { withScreen } from 'sources/co/Screen'
import { withStore } from './store'
import { withApp, registerUnits } from './context'
import { routes } from './routes'
import * as units from './units'
import Main from './Main'

registerUnits(units)

export default composeReactBoot (
  Main,
  withStore,
  withRouting(routeObjects(routes)),
  withApp,
  withRoot,
  withScreen,
)
