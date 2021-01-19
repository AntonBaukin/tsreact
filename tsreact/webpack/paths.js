const path = require('path')
const base = path.join(__dirname, '..')
const index = path.join(base, 'index')

module.exports = () => ({
	modules: path.resolve(base, 'node_modules'),
	public: path.resolve(base, 'public'),
	output: path.resolve(base, 'build'),
	main: {
		sources: path.resolve(base, 'src'),
		entry: path.resolve(index, 'main.tsx'),
		html: path.resolve(index, 'index.html'),
		output: 'scripts',
	},
	styles: {
		sources: path.resolve(base, 'styles'),
		entry: path.resolve(index, 'styles.js'),
		output: 'styles',
	}
})
