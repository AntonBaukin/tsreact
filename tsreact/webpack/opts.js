const TerserPlugin = require("terser-webpack-plugin");
const { isprod, isdev } = require('./utils')

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
	moduleIds: 'deterministic',
	chunkIds: 'deterministic',
	runtimeChunk: 'single',
	splitChunks: {
		chunks: 'all',
		minSize: 8 * 1024,
		minRemainingSize: 0,
		maxSize: (isdev(mode) ? 2048 : 256) * 1024,
		minChunks: 1,
		maxAsyncRequests: 4,
		maxInitialRequests: 4,
		enforceSizeThreshold: 64 * 1024,
		cacheGroups: {
			libraries: {
				test: /[\\/]node_modules[\\/]/,
				priority: -10,
				reuseExistingChunk: true
			},
			default: {
				minChunks: 2,
				priority: -20,
				reuseExistingChunk: true
			}
		}
	}
})
