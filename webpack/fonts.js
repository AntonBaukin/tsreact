const useFontsLoader = (paths) => [{
	loader: 'file-loader',
	options: {
		name: '[name].[ext]',
		outputPath: paths.fonts.output,
		publicPath: paths.fonts.public
	}
}]

module.exports = { useFontsLoader }
