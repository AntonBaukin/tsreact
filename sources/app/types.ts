import { Action, Dispatch, UnknownAction } from 'redux'

export type StateBase = Record<string, object>

export type DispatchBase<A extends Action = UnknownAction> = Dispatch<A>

export type InferDispatchAction<D> = D extends Dispatch<infer A> ? A : never

export interface GetStore<S extends StateBase, D extends DispatchBase>
{
  get state(): S

  get dispatch(): D
}

export type AppContext <
  S extends StateBase = StateBase,
  D extends DispatchBase = DispatchBase,
> = GetStore<S, D> // & ...

export const makeAppContext = <
  S extends StateBase,
  D extends DispatchBase,
> (
  getStore: GetStore<S, D>
): AppContext<S, D> => {
  return {
    get state() {
      return getStore.state
    },

    get dispatch() {
      return getStore.dispatch
    }
  }
}
