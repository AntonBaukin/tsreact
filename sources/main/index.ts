import { makeReactBoot, withRoot } from 'sources/co/Root'
import { withScreen } from 'sources/co/Screen'
import Main from './Main'

export default makeReactBoot (
  withRoot(withScreen(Main))
)
