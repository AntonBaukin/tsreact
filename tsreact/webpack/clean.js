const { CleanWebpackPlugin } = require('clean-webpack-plugin')
const { isdev } = require('./utils')

module.exports = ({ mode }) => isdev(mode) ? [] : [
	new CleanWebpackPlugin()
]
