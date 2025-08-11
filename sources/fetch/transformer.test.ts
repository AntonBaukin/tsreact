import { describe, expect, test } from '@jest/globals'
import {
  autoTransform,
  AutoTransformer,
  ITransformer,
  toTransform,
  Transformer,
} from './transformer'

interface SimpleObject {
  a: string,
  b: number,
  i: number,
  c: boolean,
}

describe('transformer', () => {
  test('simpleManual', () => {

    class SimpleTr extends Transformer<SimpleObject>
      implements ITransformer<SimpleObject>
    {
      get a() {
        return this.$string('a')
      }

      get b() {
        return this.$number('b')
      }

      get i() {
        return this.$integer('i')
      }

      get c() {
        return this.$boolean('c')
      }
    }

    const simpleTr = toTransform(SimpleTr)

    const a = { a: 'Aaa', b: 12.3, i: 345, c: true }
    expect(simpleTr(a)).toStrictEqual(a)

    const b = { b: 12.3, i: 345, c: true }
    expect(() => simpleTr(b)).toThrow('".a" is nil or is not a string: undefined')

    const c = { a: 'Aaa', b: 12.3, i: 34.5, c: true }
    expect(() => simpleTr(c)).toThrow('".i" is nil or is not an integer number: 34.5')
  })

  test('directAuto', () => {
    class SimpleAutoTr extends AutoTransformer<SimpleObject> {
      readonly $auto = {
        a: [, this.$string],
        b: [, this.$number],
        i: [, this.$integer],
        c: [, this.$boolean],
      } as const
    }

    const simpleAutoTr = toTransform(SimpleAutoTr)

    const a = { a: 'Aaa', b: 12.3, i: 345, c: true }
    expect(simpleAutoTr(a)).toStrictEqual(a)
  })

  test('autoTransform', () => {
    const autoTr = autoTransform((self) => ({
        a: [, self.$string],
        b: [, self.$number],
        i: [, self.$integer],
        c: [, self.$boolean],
      }))

    const a = { a: 'Aaa', b: 12.3, i: 345, c: true }
    expect(autoTr(a)).toStrictEqual(a)
  })

  test('withPath', () => {
    const autoTr = autoTransform((self) => ({
        a: ['x.a', self.$string],
        b: ['x.n.1', self.$number],
        i: [['x', 'y', 'i'], self.$integer],
        c: ['flag', self.$boolean],
      }))

    const a = { x: { a: 'Aaa', n: [, 12.3], y: { i: 345 } }, flag: true }
    const b = { a: 'Aaa', b: 12.3, i: 345, c: true }
    expect(autoTr(a)).toStrictEqual(b)
  })
})
