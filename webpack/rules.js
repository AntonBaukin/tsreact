const { useGlobalCss, useModuleCss } = require('./css')
const { useFontsAsset } = require('./fonts')

module.exports = ({ paths }) => [
  {
    test: /\.(ts|js)x?$/,
    enforce: 'pre',
    use: 'source-map-loader'
  },
  {
    test: /\.(ts|js)x?$/,
    exclude: '/node_modules/',
    use: 'babel-loader'
  },
  {
    test: /\.(scss|css)$/,
    exclude: /\.module.scss$/,
    use: useGlobalCss(paths)
  },
  {
    test: /\.module.scss$/,
    use: useModuleCss(paths)
  },
  {
    test: /\.woff2$/,
    ...useFontsAsset(paths)
  },
]
