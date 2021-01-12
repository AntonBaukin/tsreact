const clean = require('./clean')
const copy = require('./copy')
const check = require('./check')
const html = require('./html')

module.exports = (vars) => [
	...clean(vars),
	...check(vars),
	...copy(vars),
	...html(vars),
]
