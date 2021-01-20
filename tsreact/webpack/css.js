const path = require('path')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')

const cssPlugins = ({ paths }) => [
	new MiniCssExtractPlugin({
		filename: path.join(paths.styles.output, '[name].[contenthash].css')
	})
]

const useCss = (paths) => [
	{
		loader: MiniCssExtractPlugin.loader
	},
	{
		loader: 'css-loader',
		options: {
			sourceMap: true,
			importLoaders: 1,
			modules: {
				localIdentName: '[local]-[hash:base64:8]'
			}
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
		loader: 'resolve-url-loader',
		options: {
			sourceMap: true,
		}
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
