const WebpackCopy = require('copy-webpack-plugin')
const ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin')

module.exports = (env, args) => {
  const mode = require('./webpack/mode')({ env, args })
  const paths = require('./webpack/paths')({ mode })
  const rules = require('./webpack/rules')({ mode })
  const plugins = require('./webpack/plugins')({ mode, paths })
  const optimization = require('./webpack/opts')({ mode })
  const devServer = require('./webpack/server')()
  const isdev = mode === 'development'

  return {
    mode,
    plugins,
    optimization,
    devServer,
    module: {
      rules
    },
    output: {
      path: paths.output
    },
    resolve: {
      extensions: ['.ts', '.tsx', '.js', '.json']
    },
    entry: {
      main: paths.main.entry
    },
    devtool: isdev ? 'source-map' : false,
  }
}
