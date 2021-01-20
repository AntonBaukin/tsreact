const path = require('path')

module.exports = (env, args) => {
  const mode = require('./webpack/mode')({ env, args })
  const paths = require('./webpack/paths')({ mode })
  const rules = require('./webpack/rules')({ paths })
  const plugins = require('./webpack/plugins')({ mode, paths })
  const optimization = require('./webpack/opts')({ mode })
  const devServer = require('./webpack/server')()

  return {
    mode,
    plugins,
    optimization,
    devServer,
    module: {
      rules
    },
    output: {
      path: paths.output,
      filename: path.join(paths.main.output, '[name].[contenthash].js')
    },
    entry: {
      main: paths.main.entry,
      styles: paths.styles.entry,
    },
    resolve: {
      extensions: ['.ts', '.tsx', '.js', '.json'],
      modules: [ paths.modules ],
      alias: {
        src: paths.main.sources
      }
    },
    devtool: 'source-map',
  }
}
