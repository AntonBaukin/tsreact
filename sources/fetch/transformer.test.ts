import { describe, expect, test } from '@jest/globals'
import { asTransform } from './types'
import {
  autoTransform,
  autoTransformSimple,
  AutoTransformer,
  ITransformer,
  toTransform,
  Transformer,
} from './transformer'

interface Simple {
  a: string,
  b: number,
  i: number,
  c: boolean,
}

interface Nested {
  x: number,
  y: number,
}

interface Outer {
  a: string,
  u: Nested,
  v: Nested | undefined,
}

interface Data {
  a: string,
  v: Nested[] | undefined,
  i: number[] | undefined,
}

describe('transformer', () => {
  test('simpleManual', () => {

    class SimpleTr extends Transformer<Simple>
      implements ITransformer<Simple>
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
    class SimpleAutoTr extends AutoTransformer<Simple> {
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
    const autoTr = autoTransformSimple<Simple>((self) => ({
        a: self.$string,
        b: self.$number,
        i: self.$integer,
        c: self.$boolean,
      }))

    const a = { a: 'Aaa', b: 12.3, i: 345, c: true }
    expect(autoTr(a)).toStrictEqual(a)
  })

  test('withPath', () => {
    const autoTr = autoTransform<Simple>((self) => ({
        a: ['x.a', self.$string],
        b: ['x.n.1', self.$number],
        i: [['x', 'y', 'i'], self.$integer],
        c: ['flag', self.$boolean],
      }))

    const a = { x: { a: 'Aaa', n: [, 12.3], y: { i: 345 } }, flag: true }
    const b = { a: 'Aaa', b: 12.3, i: 345, c: true }
    expect(autoTr(a)).toStrictEqual(b)
  })

  test('subObject', () => {
    const subTr = autoTransformSimple<Nested>((self) => ({
        x: self.$number,
        y: self.$number,
    }))

    const outerTr = autoTransformSimple<Outer>((self) => ({
        a: self.$string,
        u: self.$object(subTr),
        v: self.$objectOptional(subTr),
    }))

    const a = { a: 'Aaa', u: { x: 0, y: 1 }, v: { x: 0.5, y: 10 } }
    expect(outerTr(a)).toStrictEqual(a)

    const b = { a: 'Bbb', u: { x: 10, y: 11 } }
    expect(outerTr(b)).toStrictEqual(b)

    const c = { a: 'Ccc' }
    expect(() => outerTr(c)).toThrow('".u" is not an object: undefined')

    const d = { a: 'Ddd', u: { x: -12, y: '11' } }
    expect(() => outerTr(d)).toThrow('".y" is nil or is not a finite number: 11')
  })

  test('subArray', () => {
    const subTr = autoTransformSimple<Nested>((self) => ({
        x: self.$number,
        y: self.$number,
    }))

    const dataTr = autoTransformSimple<Data>((self) => ({
        a: self.$string,
        v: self.$arrayOptional(subTr),
        i: self.$arrayOptional(asTransform(Number)),
    }))

    const a = { a: 'Data', v: [{ x: 1, y: 2 }, { x: 0.5, y: -1.5 }, { x: 10, y: 20 }] }
    expect(dataTr(a)).toStrictEqual(a)

    const b = { a: 'Vector', v: [{ x: 1, y: 2 }], i: [1, 2, 3, 4, 5] }
    expect(dataTr(b)).toStrictEqual(b)
  })
})
