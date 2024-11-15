import { isNil, isString } from './utils/lodash.mjs'
import {
  badReqAssert,
  makeReqBodyPrepare,
  makeReqPrepare,
} from './utils/request.mjs'

export default (router, personsView) => {
  router.get('/all', handlePersonsAll(personsView))
  router.post('/search', handlePersonsSearch(personsView))
}

const handlePersonsAll = makeReqPrepare((personsView, req) => {
  const sort = reqPersonsOrder(req)

  if (sort === 'name') {
    return personsView.selectByName()
  }

  if (sort === 'dob') {
    return personsView.selectByDob()
  }
})

const handlePersonsSearch = makeReqBodyPrepare(
  (personsView, body, req) => {
    const sort = reqPersonsOrder(req)

    if (!isNil(body.years)) {
      badReqAssert(Array.isArray(body.years))
      badReqAssert(body.years.length)
      body.years.forEach(year => {
        badReqAssert(Number.isInteger(year))
        badReqAssert(year > 1900 && year < 2100)
      })
    }

    if (!isNil(body.name)) {
      badReqAssert(isString(body.name))
      badReqAssert(body.name.trim().length)
    }

    if (isNil(body.years)) {
      return personsView.selectByName(body.name, sort)
    } else {
      return personsView.selectByDob(body.name, body.years, sort)
    }
  }
)

const typePersonsSort = (v = 'name') =>
  v === 'name' || v === 'dob' ? v : null

const reqPersonsOrder = (req) => badReqAssert(
  typePersonsSort(req.query.sort)
)
