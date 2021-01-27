import { createStore } from 'redux'
import AppContext from 'src/data/AppContext'
import Registry from 'src/data/Registry'
import dataUnits from './units'

const registry = new Registry()
const store = createStore(registry.reducer, {})
const appContext = new AppContext({ store, registry })

registry.appContext = appContext
registry.registerUnits(dataUnits)

export default appContext
