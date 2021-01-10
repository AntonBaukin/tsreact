const WebpackCopy = require('copy-webpack-plugin')
const ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin')

module.exports = (env, args) => {
  const mode = require('./webpack/mode')({ env, args })
  const paths = require('./webpack/paths')({ mode })
  const rules = require('./webpack/rules')({ mode })
  const plugins = require('./webpack/plugins')({ mode, paths })
  const devServer = require('./webpack/server')()

  return {
    mode,
    plugins,
    devServer,
    module: {
      rules
    },
    output: {
      filename: '[name].js',
      path: paths.output
    },
    resolve: {
      extensions: ['.ts', '.tsx', '.js', '.json']
    },
    entry: {
      main: paths.main.entry
    }
  }
}
