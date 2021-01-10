const WebpackCopy = require('copy-webpack-plugin')
const ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin')

module.exports = ({ mode, paths }) => [
	new WebpackCopy({
		patterns: [
			{
				from: paths.public
			}
		]
	}),
	new ForkTsCheckerWebpackPlugin({
		async: false
	})
]
