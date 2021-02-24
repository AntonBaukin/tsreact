import { createAppStore } from 'src/components/AppBase'
import AppContext from 'src/data/AppContext'
import Registry from 'src/data/Registry'
import RestClient from 'src/rest/RestClient'
import middleware from './middleware'
import dataUnits from './units'

const registry = new Registry()
const store = createAppStore(registry.reducer, ...middleware(registry))
const restClient = new RestClient()
const appContext = new AppContext({ store, registry, restClient })

registry.appContext = appContext
registry.registerUnits(dataUnits)

export default appContext
