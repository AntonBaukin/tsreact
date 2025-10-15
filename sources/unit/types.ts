import { UnknownAction } from 'redux'
import { Draft, Immutable } from 'immer'
import { isArrayLike, isFunction, isObject, isString } from 'sources/lodash'
import { AppContext, DispatchBase, StateBase } from 'sources/app'

export type PayloadSimple = null | string | number | boolean

export type Payload = PayloadSimple | Payload[] | { [key: string]: Payload }

export type UnitListener<U extends DataUnit = DataUnit> = (unit: U) => void;

export type UnitListenerConnect = (listener: UnitListener) => (() => void);

export const symDataUnit = Symbol.for('DataUnit')

/**
 * Minimal Data Unit has only action name.
 */
export interface DataUnit extends UnknownAction
{
  readonly dataUnit: typeof symDataUnit,

  /**
   * Name of a Data Unit is global name of Redux action
   * this unit (as a singleton) represents.
   */
  readonly type: string,

  readonly actsOn?: () => Array<DataUnit | string>,

  /**
   * Auto-assigned when registering units.
   *
   * While actsOn property is intendent to link Data Units,
   * lower-level listen() function connects arbitrary
   * applicant to the reaction infrastructure.
   *
   * @returns unsubscribe function.
   */
  readonly listen: UnitListenerConnect,

  /**
   * Whether the trigger function is invoked synchronously.
   * Defaults to false.
   */
  readonly triggerSync?: boolean,

  readonly trigger?: (
    // This data unit instance:
    this: DataUnit,
    // Type of common action, or type of the data unit given:
    type: string,
    payload: unknown,
    unit?: DataUnit,
  ) => void,

  /**
   * Auto-assigned when registering units. The same for all units.
   *
   * @param unit — a Data Unit to dispatch into Redux.
   * @param payload — optional payload, clones the unit as a Payload one.
   */
  readonly dispatch: <P extends Payload>(unit: DataUnit, payload?: P) => void,

  /**
   * Shorthand for unit.dispatch(unit).
   */
  readonly dispatchIt: () => void,
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
  readonly parentUnit: typeof symParentUnit,

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
  readonly initUnit: typeof symInitUnit,

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
  readonly onlyUnit: typeof symOnlyUnit,

  /**
   * Optional predicate. Invoked with this-context of the Data Unit.
   */
  readonly isOnlyUnit?: () => boolean,
}

export const isOnlyUnit = (some: unknown): some is OnlyUnit =>
  isDataUnit(some) && (some as any).onlyUnit === symOnlyUnit

export const symPayloadUnit = Symbol.for('DataUnit.Payload')

export const isPayload = (some: unknown): some is Payload => {
  const objects: any[] = []

  const check = (x: unknown) => {
    if (x === null || isString(x) || Number.isFinite(x) || x === true || x === false) {
      return true
    }

    // Cycled structures are rejected:
    if (isObject(x) || isArrayLike(x)) {
      if (objects.includes(x)) {
        return false
      } else {
        objects.push(x)
      }
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

  return check(some)
}

export interface PayloadUnit<P extends Payload = Payload> extends DataUnit
{
  readonly payloadUnit: typeof symPayloadUnit,

  get payload(): P | undefined,

  readonly dispatchSelf: (payload: P) => void,
}

export const isPayloadUnit = <P extends Payload = Payload>(
  some: unknown,
): some is PayloadUnit<P> =>
  isDataUnit(some) && (some as any).payloadUnit === symPayloadUnit

export const symPlainUnit = Symbol.for('DataUnit.Plain')

/**
 * Plain Unit represents Redux action with string type and optional
 * payload — in tis case it's also a Payload Unit.
 */
export interface PlainUnit extends DataUnit
{
  readonly plainUnit: typeof symPlainUnit,
}

export const isPlainUnit = (some: unknown): some is PlainUnit =>
  isDataUnit(some) && (some as any).plainUnit === symPlainUnit

export const symReduceUnit = Symbol.for('DataUnit.Reduce')

/**
 * Reuce Unit incorporates own reduce function that is invoked
 * to update the state of the store before processing further.
 */
export interface ReduceUnit <
  // Type of the application state:
  S extends any = StateBase,
  // Type of the unit slice:
  X extends any = S,
  // Type of the payload:
  P extends Payload = Payload,
> extends DataUnit
{
  readonly reduceUnit: typeof symReduceUnit,

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
  readonly initialState?: X | (() => X),

  get currentState(): Immutable<X>,

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
   * @returns optional, returns the new state, or updates the state proxy.
   */
  reduce(draft: Draft<X>, payload: P | null): X | void,

  readonly dispatchSelf: (payload: P) => void,
}

export const isReduceUnit = <S extends any = StateBase, U extends any = S> (
  some: unknown,
): some is ReduceUnit<S, U> =>
  isDataUnit(some) && (some as any).reduceUnit === symReduceUnit

export const symCloneUnit = Symbol.for('DataUnit.Clone')

export interface CloneUnit extends DataUnit
{
  readonly cloneUnit: typeof symCloneUnit,

  original: DataUnit,
}

export const isCloneUnit = (some: unknown): some is CloneUnit =>
  isDataUnit(some) && (some as any).cloneUnit === symCloneUnit

export const symDispatchSelf = Symbol.for('DataUnit.dispatchSelf')

export interface DispatchSelf<A extends any[] = any[], P extends Payload = Payload>
{
  (...args: A): void,

  readonly dispatchSelf: typeof symDispatchSelf,

  readonly unit: DataUnit,
}

export const isDispatchSelf = <A extends any[] = any[], P extends Payload = Payload> (
  some: unknown,
): some is DispatchSelf<A, P> =>
  isFunction(some) && (some as any).dispatchSelf === symDispatchSelf

export type PayloadResult<P> =
  | P
  | null
  | undefined
  | void
  | Promise<P | null | undefined | void>

/**
 * Extension object to data unit builder with builders of payloads to dispatch.
 * The limitation is that each builder must have the same function signature:
 * thus, commonly such an object have only one key.
 *
 * Hint: by returning nil, the action is not dispatched.
 */
export type DataUnitDispatchers <
  U extends DataUnit,
  A extends any[] = any[],
  P extends Payload = Payload,
> = Record<string, (this: U, ...args: A) => PayloadResult<P>>

/**
 * Extension of a Data Unit with (self) dispatchers.
 */
export type ExtendDataUnitDispatchers <
  U extends DataUnit,
  A extends any[],
  P extends Payload,
  D extends DataUnitDispatchers<U, A, P>,
> = U & Record<keyof D, DispatchSelf<A, P>>

export const symUnitSelector = Symbol.for('DataUnit.selector')

/**
 * State selector bound to a Data Unit.
 */
export interface UnitSelector<S, R> {
  (state: S): R,

  readonly unitSelector: typeof symUnitSelector,

  readonly unit: DataUnit,
}

export const isUnitSelector = <S extends any = any, R extends any = any> (
  some: unknown,
): some is UnitSelector<S, R> =>
  isFunction(some) && (some as any).unitSelector === symUnitSelector

export type DataUnitSelectors<S extends any, R extends any, U extends DataUnit> =
  Record<string, (this: U, state: S) => R>

export type ExtendDataUnitSelectors <
  // Application (global) state:
  S extends any,
  // State passed to the defined selectors:
  X extends any,
  R extends any,
  U extends DataUnit,
  E extends DataUnitSelectors<X, R, U>,
> = U & Record<keyof E, UnitSelector<S, R>>

/**
 * Root for structures that define various Data Unit intsnces of the application.
 */
export interface DefineUnit <
  // Application global state:
  S extends StateBase,
  // Application dispatcher type:
  D extends DispatchBase = DispatchBase,
> {
  name: string, // i.e. type of Redux action

  init?: (appContext: AppContext<S, D>) => void,

  actsOn?: () => Array<DataUnit | string>,

  trigger?: (type: string, payload: unknown, unit?: DataUnit) => void,
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
> extends DefineUnit<S, D> {
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

  select <R extends any>(ext: DataUnitSelectors<S, R, U>):
    GlobalUnitBuilder<S, D, P, ExtendDataUnitSelectors<S, S, R, U, typeof ext>>,
}

/**
 * Definition of a Data Unit that reduces specified slice of the Redux state.
 */
export interface DefineSliceUnit <
  S extends StateBase,
  K extends keyof S,
  D extends DispatchBase = DispatchBase,
  P extends Payload = Payload,
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

  select <R extends any>(ext: DataUnitSelectors<S[K], R, U>):
    SliceUnitBuilder<S, K, D, P, ExtendDataUnitSelectors<S, S[K], R, U, typeof ext>>,
}

/**
 * Definition of a Data Unit that reduces own (private) slice of the Redux state
 * that has the same name as the name of the unit (treated as a Lodash path).
 */
export interface DefineOwnUnit <
  S extends StateBase,
  X extends Payload,
  D extends DispatchBase = DispatchBase,
  P extends Payload = Payload,
> extends DefineUnit<S, D> {
  // The initial state is required:
  initialState: X | (() => X),

  // This reducer updates Immer draft of the private slice:
  reduceOwn: (draft: X, payload: P | null) => X | void,

  payload?: (() => P) | P,
}

export interface OwnUnitBuilder <
  S extends StateBase,
  X extends Payload,
  D extends DispatchBase = DispatchBase,
  P extends Payload = Payload,
  U extends ReduceUnit<S, X, P> = ReduceUnit<S, X, P>,
> extends UnitBuilder<S, D, U> {
  get dataUnit(): U,

  // Adds self-dispatchers to the Unit, extending it's final type:
  dispatchSelf <A extends any[] = any[]>(ext: DataUnitDispatchers<U, A, P>):
    OwnUnitBuilder<S, X, D, P, ExtendDataUnitDispatchers<U, A, P, typeof ext>>,

  select <R extends any>(ext: DataUnitSelectors<X, R, U>):
    OwnUnitBuilder<S, X, D, P, ExtendDataUnitSelectors<S, X, R, U, typeof ext>>,
}
