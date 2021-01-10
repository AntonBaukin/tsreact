module.exports = () => [
	{
		test: /\.(ts|js)x?$/,
		exclude: '/node_modules/',
		use: 'babel-loader'
	}
]
