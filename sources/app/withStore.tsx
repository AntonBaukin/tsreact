import { FC } from 'react'
import { Action, Store } from 'redux'
import { Provider } from 'react-redux'
import { StateBase } from './types'

export const makeWithStore = <S extends StateBase, A extends Action> (
  store: Store<S, A>,
) => (Component: FC) => {
  const StoreComponent: FC = () => {
    return (
      <Provider store={store}>
        <Component />
      </Provider>
    )
  }

  StoreComponent.displayName = `Store_${Component.displayName ?? 'Component'}`

  return StoreComponent
}
