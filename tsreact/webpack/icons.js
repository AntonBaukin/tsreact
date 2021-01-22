const path = require('path')
const SVGSpritemapPlugin = require('svg-spritemap-webpack-plugin')
const bootstrapIcons = require('../src/components/Icon/bootstrap.json')

const bootstrapIconsFiles = (paths) => (
	bootstrapIcons.map(icon => path.join(paths.icons.bootstrap, `${icon}.svg`))
)

const iconsSpritePlugins = ({ paths }) => [
	new SVGSpritemapPlugin(
		bootstrapIconsFiles(paths),
		{
			output: {
				filename: paths.icons.spriteFile,
				svgo: true
			},
			sprite: {
				// Sprite SVG from Bootstrap Icons has no prefix:
				prefix: () => '',
				generate: {
					title: false,
					use: true
				}
			}
		}
	)
]

module.exports = { iconsSpritePlugins }
