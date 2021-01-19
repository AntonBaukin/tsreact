const { useCss } = require('./css')

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
]
