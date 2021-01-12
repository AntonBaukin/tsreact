const WebpackCopyPlugin = require('copy-webpack-plugin')

const patterns = (paths) => [
	{ from: paths.public },
]

module.exports = ({ paths }) => [
	new WebpackCopyPlugin({ patterns: patterns(paths) }),
]
