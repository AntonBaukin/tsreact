const HtmlWebpackPlugin = require('html-webpack-plugin')
const { isprod } = require('./utils')

module.exports = ({ mode, paths }) => [
	new HtmlWebpackPlugin({
		template: paths.main.html,
		scriptLoading: 'defer',
		inject: 'head',
		minify: isprod(mode),
	}),
]
