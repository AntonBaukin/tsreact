const TerserPlugin = require('terser-webpack-plugin')
const { isPROD, isDEV } = require('./utils')

const terser = (mode) => new TerserPlugin({
  extractComments: isDEV(mode),
  terserOptions: {
    sourceMap: true,
    format: {
      comments: isDEV(mode),
    },
  }
})

module.exports = ({ mode }) => ({
  minimize: isPROD(mode),
  minimizer: [
    terser(mode),
  ],
  moduleIds: 'deterministic',
  chunkIds: 'deterministic',
  runtimeChunk: 'single',
  splitChunks: {
    chunks: 'all',
    minSize: 4 * 1024,
    minRemainingSize: 0,
    maxSize: (isDEV(mode) ? 1024 : 256) * 1024,
    minChunks: 1,
    maxAsyncRequests: 16,
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
      },
    }
  }
})
