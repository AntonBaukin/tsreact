const path = require('path')
const base = path.join(__dirname, '..')
const index = path.join(base, 'index')

module.exports = () => ({
	public: path.resolve(base, 'public'),
	output: path.resolve(base, 'build'),
	main: {
		entry: path.resolve(index, 'index.tsx'),
		html: path.resolve(index, 'index.html'),
	}
})
