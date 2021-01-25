import { createStore } from 'redux'
import AppContext from 'src/data/AppContext'
import Registry from 'src/data/Registry'
import { DataUnitConstructor } from 'src/data/DataUnit'

import initialState, { StateType } from './state'
import dataUnits from './units'

const registry = new Registry<StateType>()
const store = createStore(registry.reducer, initialState)
const appContext = new AppContext({ store, registry })

registry.registerUnits(
	appContext,
	dataUnits as Array<DataUnitConstructor<StateType>>
)

export default appContext
