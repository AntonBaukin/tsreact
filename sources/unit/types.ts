import { UnknownAction } from 'redux'
import { isObject } from 'sources/lodash'
import { AppContext } from 'sources/app'

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

  init(appContext: AppContext): void,
}

export const isInitUnit = (some: unknown): some is InitUnit =>
  isDataUnit(some) && (some as any).initUnit === symInitUnit

export const symOnlyUnit = Symbol.for('DataUnit.Only')

/**
 * Units marked with this interface are not passed further as pure Redux actions.
 */
export interface OnlyUnit extends DataUnit
{
  onlyUnit: typeof symOnlyUnit,

  /**
   * Optional predicate.
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

export interface PayloadUnit extends DataUnit
{
  payloadUnit: typeof symPayloadUnit,

  get payload(): Payload,
}

export const isPayloadUnit = (some: unknown): some is PayloadUnit =>
  isDataUnit(some) && (some as any).payloadUnit === symPayloadUnit
