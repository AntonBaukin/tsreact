const copy = require('./copy')
const check = require('./check')

module.exports = (vars) => [
	...copy(vars),
	...check(vars),
]
