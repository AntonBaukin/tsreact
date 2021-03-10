const clean = require('./clean')
const copy = require('./copy')
const check = require('./check')
const html = require('./html')
const lang = require('./lang')
const { cssPlugins } = require('./css')
const { iconsSpritePlugins } = require('./icons')

module.exports = (vars) => [
	...clean(vars),
	...check(vars),
	...copy(vars),
	...html(vars),
	...lang(vars),
	...cssPlugins(vars),
	...iconsSpritePlugins(vars),
]
