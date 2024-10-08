const ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin')
const WebpackCopyPlugin = require('copy-webpack-plugin')
const HtmlWebpackPlugin = require('html-webpack-plugin')

const config = require('../config.json')
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
    title: config.pageTitle,
    template: paths.main.html,
    scriptLoading: 'defer',
    inject: 'head',
    minify: isPROD(mode),
    reactRootId: config.reactRootId,
    defaultLang: config.defaultLang,
  }),

  ...unwrap(
    { mode, paths, ...vars },
    lang,
    cssPlugins,
    iconsSpritePlugins,
  ),
]
