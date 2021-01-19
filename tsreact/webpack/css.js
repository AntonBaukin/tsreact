const MiniCssExtractPlugin = require('mini-css-extract-plugin')

const cssPlugins = () => [
	new MiniCssExtractPlugin({
		filename: '[name].[contenthash].css'
	})
]

const useCss = (paths) => [
	{
		loader: MiniCssExtractPlugin.loader
	},
	{
		loader: 'css-loader',
		options: {
			modules: true,
			sourceMap: true,
			importLoaders: 1
		}
	},
	{
		loader: 'postcss-loader',
		options: {
			postcssOptions: {
				plugins: ['autoprefixer']
			}
		}
	},
	{
		loader: 'resolve-url-loader'
	},
	{
		loader: 'sass-loader',
		options: {
			sourceMap: true,
			sassOptions: {
				includePaths: [
					paths.styles.sources
				]
			}
		}
	},
]

module.exports = { cssPlugins, useCss }
