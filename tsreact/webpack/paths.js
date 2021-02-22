const path = require('path')
const base = path.join(__dirname, '..')
const modules = path.join(base, 'node_modules')
const index = path.join(base, 'index')
const lang = path.join(base, 'lang')

module.exports = () => ({
	modules: path.resolve(base, 'node_modules'),
	public: path.resolve(base, 'public'),
	output: path.resolve(base, 'build'),
	main: {
		sources: path.resolve(base, 'src'),
		entry: path.resolve(index, 'main.tsx'),
		html: path.resolve(index, 'index.html'),
		output: 'scripts'
	},
	styles: {
		sources: path.resolve(base, 'styles'),
		entry: path.resolve(index, 'styles.js'),
		output: 'styles'
	},
	fonts: {
		output: 'fonts',
		public: '../fonts'
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
