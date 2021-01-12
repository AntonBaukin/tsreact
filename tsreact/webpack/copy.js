const WebpackCopy = require('copy-webpack-plugin')

const patterns = (paths) => [
	{ from: paths.public },
]

module.exports = ({ paths }) => [
	new WebpackCopy({ patterns: patterns(paths) }),
]
