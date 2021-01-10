const path = require('path')
const base = path.join(__dirname, '..')

module.exports = () => ({
	public: path.resolve(base, 'public'),
	output: path.resolve(base, 'build'),
	main: {
		entry: path.join(base, 'src', 'index.tsx'),
	}
})
