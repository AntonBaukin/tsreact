const clean = require('./clean')
const copy = require('./copy')
const check = require('./check')
const html = require('./html')
const { cssPlugins } = require('./css')
const { iconsSpritePlugins } = require('./icons')

module.exports = (vars) => [
	...clean(vars),
	...check(vars),
	...copy(vars),
	...html(vars),
	...cssPlugins(vars),
	...iconsSpritePlugins(vars),
]
