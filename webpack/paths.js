const path = require('path')
const base = path.join(__dirname, '..')
const modules = path.join(base, 'node_modules')
const index = path.join(base, 'index')
const lang = path.join(base, 'lang')
const config = require('../config.json')

module.exports = () => ({
  base: path.resolve(base),
  publicPath: config.publicPath || '/',
  modules: path.resolve(base, 'node_modules'),
  public: path.resolve(base, 'public'),
  output: path.resolve(base, 'build'),
  config: path.resolve(base, 'config.json'),
  main: {
    sources: path.resolve(base, 'sources'),
    entry: path.resolve(index, 'main.js'),
    html: path.resolve(index, 'index.html'),
    outputTemplate: path.join('scripts', '[name].[contenthash:8].js'),
  },
  styles: {
    sources: path.resolve(base, 'styles'),
    entry: path.resolve(index, 'styles.js'),
    output: 'styles'
  },
  fonts: {
    output: 'fonts',
  },
  icons: {
    bootstrap: path.resolve(modules, 'bootstrap-icons', 'icons'),
    spriteFile: path.join('images', 'icons.svg')
  },
  lang: {
    items: ['en'],
    output: 'lang',
    en: path.resolve(lang, 'en.json'),
  }
})
