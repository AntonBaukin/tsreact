const TerserPlugin = require("terser-webpack-plugin");

const isprod = (mode) => mode === 'production'
const isdev = (mode) => mode === 'development'

const terser = (mode) => new TerserPlugin({
	extractComments: isdev(mode),
	terserOptions: {
		sourceMap: true,
		format: {
			comments: isdev(mode),
		},
	}
})

module.exports = ({ mode }) => ({
	minimize: isprod(mode),
	minimizer: [
		terser(mode),
	],
})
