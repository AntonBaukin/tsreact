import { FC } from 'react'
import { Action, Store } from 'redux'
import { Provider } from 'react-redux'
import { nameHoc } from 'sources/co/utils/compose'
import { StateBase } from './types'

export const makeWithStore = <S extends StateBase, A extends Action> (
  store: Store<S, A>,
) => (Component: FC) => nameHoc (
  'Store',
  Component,
  () => (
    <Provider store={store}>
      <Component />
    </Provider>
  ),
)
