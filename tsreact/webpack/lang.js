const WebpackCopyPlugin = require('copy-webpack-plugin')

const copyLang = (paths, lang) => new WebpackCopyPlugin({
	patterns: [{
		from: paths.lang[lang],
		to: `${paths.lang.output}/[name].js`,
		toType: 'template',

		transform: (content) => (
			`(window.LANG = window.LANG || {}).${lang} = `.concat(content.toString())
		)
	}]
})

module.exports = ({ paths }) => paths.lang.items.map(lang => copyLang(paths, lang))
