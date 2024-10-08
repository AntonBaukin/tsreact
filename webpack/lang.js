const WebpackCopyPlugin = require('copy-webpack-plugin')
const config = require('../config.json')

const copyLang = (paths, lang) => new WebpackCopyPlugin({
  patterns: [{
    from: paths.lang[lang],
    to: `${paths.lang.output}/[name].js`,
    toType: 'template',

    transform: (content) => (
      `(window.${config.globalLangVariable} = window.${config.globalLangVariable} || {}).${lang} = `
        .concat(content.toString())
    )
  }]
})

module.exports = ({ paths }) =>
  paths.lang.items.map(lang => copyLang(paths, lang))
