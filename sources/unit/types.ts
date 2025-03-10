import { Draft } from 'immer'
import { UnknownAction } from 'redux'
import { isArrayLike, isFunction, isObject, isString, isFinite } from 'sources/lodash'
import { AppContext, DispatchBase, StateBase } from 'sources/app'

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

export const isPayload = (x: unknown): x is Payload => {
  if (x === null || isString(x) || isFinite(x) || x === true || x === false) {
    return true
  }

  if (isObject(x) && !isArrayLike(x)) {
    x = Object.values(x)
  }

  if (isArrayLike(x)) {
    const a = Array.isArray(x) ? x : Array.from(x)

    for (const i of a) {
      if (!(isPayload(i))) {
        return false
      }
    }

    return true
  }

  return false
}

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

export const symCloneUnit = Symbol.for('DataUnit.Clone')

export interface CloneUnit extends DataUnit
{
  cloneUnit: typeof symCloneUnit,

  original: DataUnit,
}

export const isCloneUnit = (some: unknown): some is CloneUnit =>
  isDataUnit(some) && (some as any).cloneUnit === symCloneUnit

export const symDispatchSelf = Symbol.for('DataUnit.dispatchSelf')

export interface DispatchSelf<A extends any[] = any[], P extends Payload = Payload>
{
  (...args: A): void,

  dispatchSelf: typeof symDispatchSelf,

  unit: DataUnit,
}

export const isDispatchSelf = <A extends any[] = any[], P extends Payload = Payload> (
  some: unknown,
): some is DispatchSelf<A, P> =>
  isFunction(some) && (some as any).dispatchSelf === symDispatchSelf

/**
 * Extension object to data unit builder with builders of payloads to dispatch.
 * The limitation is that each builder must have the same function signature:
 * thus, commonly such an object have only one key.
 */
export type DataUnitDispatchers <
  U extends DataUnit,
  A extends any[] = any[],
  P extends Payload = Payload,
> = Record<string, (this: U, ...args: A) => P | Promise<P>>

/**
 * Extension of a Data Unit with (self) dispatchers.
 */
export type ExtendDataUnitDispatchers <
  U extends DataUnit,
  A extends any[],
  P extends Payload,
  D extends DataUnitDispatchers<U, A, P>,
> = U & Record<keyof D, DispatchSelf<A, P>>

/**
 * Root for structures that define various Data Unit intsnces of the application.
 */
export interface DefineUnit <
  // Application global state:
  S extends StateBase,
  // Application dispatcher type:
  D extends DispatchBase = DispatchBase,
  // Extension fields:
  E extends object = {},
> {
  name: string, // i.e. type of Redux action

  init?: (appContext: AppContext<S, D>) => void,
}

export interface UnitBuilder <
  S extends StateBase,
  D extends DispatchBase = DispatchBase,
  U extends DataUnit = DataUnit,
> {
  // Terminal operation of the build sequence:
  get dataUnit(): U,
}

export interface DefineOnlyUnit <
  S extends StateBase,
  D extends DispatchBase = DispatchBase,
  E extends object = {},
> extends DefineUnit<S, D, E> {
  isOnlyUnit?: () => boolean,
}

export interface OnlyUnitBuilder <
  S extends StateBase,
  D extends DispatchBase = DispatchBase,
  U extends OnlyUnit = OnlyUnit,
> extends UnitBuilder<S, D, U> {
  get dataUnit(): U,
}

/**
 * Definition of a Data Unit that reduces the global Redux state.
 */
export interface DefineGlobalUnit <
  S extends StateBase,
  D extends DispatchBase = DispatchBase,
  // Type of payload that receives the reducer:
  P extends Payload = Payload,
  E extends object = {},
> extends DefineUnit<S, D> {
  // This reducer updates the global state via Immer draft:
  reduceGlobal: (draft: S, payload: P | null) => void,

  // Optional payload of the reduce action, or payload provider,
  // that can't be deferred (Promise) as reduce is synchronous:
  payload?: (() => P) | P,
}

export interface GlobalUnitBuilder <
  S extends StateBase,
  D extends DispatchBase = DispatchBase,
  P extends Payload = Payload,
  U extends ReduceUnit<S, S, P> = ReduceUnit<S, S, P>,
> extends UnitBuilder<S, D, U> {
  get dataUnit(): U,

  // Adds self-dispatchers to the Unit, extending it's final type:
  dispatchSelf <A extends any[] = any[]>(ext: DataUnitDispatchers<U, A, P>):
    GlobalUnitBuilder<S, D, P, ExtendDataUnitDispatchers<U, A, P, typeof ext>>,
}

/**
 * Definition of a Data Unit that reduces specified slice of the Redux state.
 */
export interface DefineSliceUnit <
  S extends StateBase,
  K extends keyof S,
  D extends DispatchBase = DispatchBase,
  P extends Payload = Payload,
  E extends object = {},
> extends DefineUnit<S, D> {
  // The name of the slice:
  slice: K,

  // This reducer updates the slice of global state via Immer draft:
  reduceSlice: (draft: S[K], payload: P | null) => S[K] | void,

  payload?: (() => P) | P,
}

export interface SliceUnitBuilder <
  S extends StateBase,
  K extends keyof S,
  D extends DispatchBase = DispatchBase,
  P extends Payload = Payload,
  U extends ReduceUnit<S, S[K], P> = ReduceUnit<S, S[K], P>,
> extends UnitBuilder<S, D, U> {
  get dataUnit(): U,

  // Adds self-dispatchers to the Unit, extending it's final type:
  dispatchSelf <A extends any[] = any[]>(ext: DataUnitDispatchers<U, A, P>):
    SliceUnitBuilder<S, K, D, P, ExtendDataUnitDispatchers<U, A, P, typeof ext>>,
}

/*

} | {
  initialState?: () => U
  // This reducer updates Immer draft of the private slice
  // (stored in Redux by the name of this unit treated as a Lodash path):
  reduceOwn: <U>(draft: U, payload: P | null) => U | void,
}

 */
