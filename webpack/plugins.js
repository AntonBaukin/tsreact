const ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin')
const WebpackCopyPlugin = require('copy-webpack-plugin')
const HtmlWebpackPlugin = require('html-webpack-plugin')

const { isPROD } = require('./utils')
const lang = require('./lang')
const { cssPlugins } = require('./css')
const { iconsSpritePlugins } = require('./icons')

const unwrap = (vars, ...modules) => modules.flatMap(module => module(vars))

module.exports = ({ mode, paths, ...vars }) => [
  new ForkTsCheckerWebpackPlugin(),

  new WebpackCopyPlugin({
    patterns: [
      { from: paths.public },
    ],
  }),

  new HtmlWebpackPlugin({
    template: paths.main.html,
    scriptLoading: 'defer',
    inject: 'head',
    minify: isPROD(mode),
  }),

  ...unwrap(
    { mode, paths, ...vars },
    lang,
    cssPlugins,
    iconsSpritePlugins,
  ),
]
