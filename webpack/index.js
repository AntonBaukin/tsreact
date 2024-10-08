const { isPROD } = require('./utils')

module.exports = (env, args) => {
  const mode = require('./mode')({ env, args })
  const paths = require('./paths')({ mode })
  const rules = require('./rules')({ paths })
  const plugins = require('./plugins')({ mode, paths })
  const optimization = require('./opts')({ mode })
  const devServer = require('./devserver')({ paths })

  return {
    mode,
    plugins,
    optimization,
    devServer,
    module: {
      rules,
    },
    output: {
      clean: isPROD(mode),
      path: paths.output,
      publicPath: paths.publicPath,
      filename: paths.main.outputTemplate,
    },
    entry: {
      main: paths.main.entry,
      styles: paths.styles.entry,
    },
    resolve: {
      extensions: ['.ts', '.tsx', '.js', '.json'],
      modules: [ paths.modules ],
      alias: {
        sources: paths.main.sources,
        styles: paths.styles.sources,
      }
    },
    devtool: 'source-map',
  }
}
