const mode = require('./webpack/mode')()
const { isPROD, isDEV } = require('./webpack/utils')

module.exports = {
  presets: [
    '@babel/preset-env',
    [
      '@babel/preset-react',
      {
        runtime: 'automatic',
      }
    ],
    '@babel/preset-typescript'
  ],
  plugins: [
    '@babel/plugin-transform-runtime'
  ],
  generatorOpts: {
    compact: isPROD(mode),
    comments: isDEV(mode),
    minified: isPROD(mode),
  },
}
