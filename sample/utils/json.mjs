import fs from 'node:fs'
import zlib from 'node:zlib'
import assert from 'node:assert'
import { Transform } from 'node:stream'
import { chain } from 'stream-chain'
import streamJson from 'stream-json'
import StreamValues from 'stream-json/streamers/StreamValues.js'
import { isObject } from './lodash.mjs'

/**
 * @returns a promise of the operation complete.
 */
export const readJsonFile = (collection, file, { gz } = {}) => {
  const { parser } = streamJson
  const { streamValues } = StreamValues

  //
  // Database is stored as JSON array with objects.
  // The task of this filter is to unwrap external array, thus
  // making the stream to be a sequence of individual objects.
  //
  class ArrayWithObjectsFilter extends Transform {
    constructor() {
      super({ objectMode: true })
    }

    _transform(chunk, _encoding, callback) {
      if (chunk.name === 'startArray') {
        if (!this.arrayIndex) {
          this.arrayIndex = 1
          callback(null)
          return
        }
      }

      if (chunk.name === 'endArray') {
        assert(this.arrayIndex)
        this.arrayIndex--
        if (!this.arrayIndex) {
          callback(null) // skip external array close
          return
        }
      }

      callback(null, chunk)
    }
  }


  return new Promise((resolve, reject) => {
    const pipeline = chain([
      fs.createReadStream(file),
      gz ? zlib.createGunzip() : ((x) => x),
      parser(),
      new ArrayWithObjectsFilter(),
      streamValues(),
    ])

    pipeline.on('error', reject)
    pipeline.on('end', resolve)

    pipeline.on('data', data => {
      assert(isObject(data) && isObject(data.value))
      collection.add(data.value)
    })
  })
}
