const { useCss } = require('./css')
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
    use: useCss(paths)
  },
  {
    test: /\.woff2$/,
    ...useFontsAsset(paths)
  },
]
