
module.exports = () => [
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
]
