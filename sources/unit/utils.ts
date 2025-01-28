import { AppContext } from 'sources/app'
import {
  DataUnit,
  symDataUnit,
  ParentUnit,
  symParentUnit,
  UnitsRegister,
  symInitUnit,
  InitUnit,
  symOnlyUnit,
  OnlyUnit,
  Payload,
  symPayloadUnit,
  PayloadUnit,
} from './types'

export const initDataUnit = <U extends object>(name: string, unit: U): U & DataUnit =>
  Object.assign(unit, { dataUnit: symDataUnit, type: name }) as (U & DataUnit)

export const makeDataUnit = (name: string): DataUnit => initDataUnit(name, {})

export const initParentUnit = <U extends DataUnit> (
  unit: U,
  children: UnitsRegister,
): U & ParentUnit =>
  Object.assign(unit, {
    parentUnit: symParentUnit,
    get children(): UnitsRegister {
      return children
    },
  }) as (U & ParentUnit)

export const markInitUnit = <U extends DataUnit>(
  unit: U & { init(appContext: AppContext): void },
): U & InitUnit => Object.assign(unit, { initUnit: symInitUnit }) as (U & InitUnit)

export const markOnlyUnit = <U extends DataUnit>(
  unit: U & { isOnlyUnit?: () => boolean },
): U & OnlyUnit => Object.assign(unit, { onlyUnit: symOnlyUnit }) as (U & OnlyUnit)

export const markPayloadUnit = <U extends DataUnit>(
  unit: U & { get payload(): Payload },
): U & PayloadUnit =>
  Object.assign(unit, { payloadUnit: symPayloadUnit }) as (U & PayloadUnit)
