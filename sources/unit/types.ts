import { Draft } from 'immer'
import { Action, UnknownAction } from 'redux'
import { isFunction, isObject } from 'sources/lodash'
import { AppContext, DispatchBase, InferDispatchAction, StateBase } from 'sources/app'

export const symDataUnit = Symbol.for('DataUnit')

/**
 * Minimal Data Unit has only action name.
 */
export interface DataUnit extends UnknownAction
{
  dataUnit: typeof symDataUnit,

  /**
   * Name of a Data Unit is global name of Redux action
   * this unit (as a singleton) represents.
   */
  readonly type: string,
}

export const isDataUnit = (some: unknown): some is DataUnit =>
  isObject(some) && (some as any).dataUnit === symDataUnit

/**
 * Recursive collection to register Data Units.
 */
export type UnitsRegister =
  | DataUnit
  | UnitsRegister[]
  // Useful for *-exports, the keys are ignored:
  | { [key: number | string | symbol]: UnitsRegister }

export const symParentUnit = Symbol.for('DataUnit.Parent')

/**
 * When registering a Parent Unit, it's children are also registered.
 */
export interface ParentUnit extends DataUnit
{
  parentUnit: typeof symParentUnit,

  get children(): UnitsRegister | null | undefined,
}

export const isParentUnit = (some: unknown): some is ParentUnit =>
  isDataUnit(some) && (some as any).parentUnit === symParentUnit

export const symInitUnit = Symbol.for('DataUnit.Init')

/**
 * Initializes Data Unit with untyped Application Context.
 * Invoked after the registration of all Units — thus,
 * do NOT dispatch ant actions that depend on Units
 * as they may not be initialized yet!
 */
export interface InitUnit extends DataUnit
{
  initUnit: typeof symInitUnit,

  /**
   * Invoked with this-context of the Data Unit.
   */
  init(appContext: AppContext): void,
}

export const isInitUnit = (some: unknown): some is InitUnit =>
  isDataUnit(some) && (some as any).initUnit === symInitUnit

export const symOnlyUnit = Symbol.for('DataUnit.Only')

/**
 * Units marked with this interface are not passed further as pure Redux actions.
 * (In this case, Reduce Units also do not work.)
 */
export interface OnlyUnit extends DataUnit
{
  onlyUnit: typeof symOnlyUnit,

  /**
   * Optional predicate. Invoked with this-context of the Data Unit.
   */
  readonly isOnlyUnit?: () => boolean,
}

export const isOnlyUnit = (some: unknown): some is OnlyUnit =>
  isDataUnit(some) && (some as any).onlyUnit === symOnlyUnit

export const symPayloadUnit = Symbol.for('DataUnit.Payload')

export type Payload =
  | null
  | string
  | number
  | boolean
  | Payload[]
  | { [key: number | string]: Payload }

export interface PayloadUnit<P extends Payload = Payload> extends DataUnit
{
  payloadUnit: typeof symPayloadUnit,

  get payload(): P,
}

export const isPayloadUnit = <P extends Payload = Payload>(
  some: unknown,
): some is PayloadUnit<P> =>
  isDataUnit(some) && (some as any).payloadUnit === symPayloadUnit

export const symReduceUnit = Symbol.for('DataUnit.Reduce')

/**
 * Reuce Unit incorporates own reduce function that is invoked
 * to update the state of the store before processing further.
 */
export interface ReduceUnit <
  // Type of the application state:
  S extends any = StateBase,
  // Type of the unit slice:
  U extends any = S,
  // Type of the payload:
  P extends Payload = Payload,
> extends DataUnit
{
  reduceUnit: typeof symReduceUnit,

  /**
   * If not defined, the reducer takes whole application state.
   *
   * If it set to true — the private state for this unit is created,
   * and saved by the name of the unit used as lodash path. In this
   * case, S template parameter defines the local state type.
   *
   * The unit may also update any application slice defined by it's
   * name, and S template parameter — is the type of that slice.
   */
  readonly slice?: true | keyof S,

  /**
   * Used for a private slice only (slice === true) to setup the initial state.
   */
  readonly initialState?: () => U,

  /**
   * Pure function (as required by Redux).
   *
   * Invoked inside Immer produce(): you may directly modify
   * the state instance, as in Redux Toolkit reducers.
   *
   * The state is application global, not a private slice,
   * unless the slice attribute is specified.
   *
   * Invoked with this-context of the Data Unit.
   * Note: that in a Reducer side-effects are not allowed.
   *
   * @param draft — Redux state wrapped with Immer produce proxy.
   *
   * @param payload — optional payload of Redux action. If this unit
   * is a Payload Unit, — the payload is created with it.
   *
   * @return optional, returns the new state, or updates the state proxy.
   */
  reduce(draft: Draft<U>, payload: P | null): U | void,
}

export const isReduceUnit = <S extends any = StateBase, U extends any = S> (
  some: unknown,
): some is ReduceUnit<S, U> =>
  isDataUnit(some) && (some as any).reduceUnit === symReduceUnit

/**
 * Composite structure to define various Data Units types for the application.
 */
export type DefineUnit <
  S extends StateBase,
  D extends DispatchBase = DispatchBase,
  A extends Action = InferDispatchAction<D>,
  P extends Payload = Payload,
  U extends any = unknown,
  K extends keyof S = keyof S,
> = {
  name: string, // i.e. type of Redux action
} & {
  init?: (appContext: AppContext<S, D>) => void,
} & {
  isOnlyUnit?: true | (() => boolean),
} & {
  payload?: (() => P) | P,
} & ({
  // This reducer updates the global state via Immer draft:
  reduceGlobal: (draft: S, payload: P | null) => void,
} | {
  initialState?: () => U
  // This reducer updates Immer draft of the private slice
  // (stored in Redux by the name of this unit treated as a Lodash path):
  reduceOwn: <U>(draft: U, payload: P | null) => U | void,
} | {
  slice: K,
  reduceSlice: (draft: S[K], payload: P | null) => S[K] | void,
})

export const symDispatchSelf = Symbol.for('DataUnit.dispatchSelf')

export interface DispatchSelf<A extends any[] = any[], P extends Payload = Payload>
{
  (...args: A): void,

  dispatchSelf: typeof symDispatchSelf,

  unit: DataUnit | undefined,
}

export const isDispatchSelf = <A extends any[] = any[], P extends Payload = Payload> (
  some: unknown,
): some is DispatchSelf<A, P> =>
  isFunction(some) && (some as any).dispatchSelf === symDispatchSelf

export const symCloneUnit = Symbol.for('DataUnit.Clone')

export interface CloneUnit extends DataUnit
{
  cloneUnit: typeof symCloneUnit,

  original: DataUnit,
}

export const isCloneUnit = (some: unknown): some is CloneUnit =>
  isDataUnit(some) && (some as any).cloneUnit === symCloneUnit
