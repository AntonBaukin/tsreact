const path = require('path')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')

const cssPlugins = ({ paths }) => [
	new MiniCssExtractPlugin({
		filename: path.join(paths.styles.output, '[name].[contenthash].css')
	})
]

const DEFAULT_MODULE_IMPORT = '@import "default.module.scss"; \n'

const defaultScssImports = (content, loaderContext) => {
	const { resourcePath } = loaderContext
	return resourcePath.endsWith('.module.scss')
		? DEFAULT_MODULE_IMPORT.concat(content)
		: content
}

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
				localIdentName: '[local]-[hash:base64:4]',
				auto: (resourcePath) => resourcePath.endsWith('.module.scss'),
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
			additionalData: defaultScssImports,
			sassOptions: {
				// importer: jsonImporter,
				includePaths: [
					paths.styles.sources
				]
			}
		}
	},
]

module.exports = { cssPlugins, useCss }
