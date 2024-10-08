const path = require('path')
const SVGSpritemapPlugin = require('svg-spritemap-webpack-plugin')

const bootstrapIconsFiles = (paths) =>
  require('../sources/co/Icon/bootstrap.json')
    .map(icon => path.join(paths.icons.bootstrap, `${icon}.svg`))

const iconsSpritePlugins = ({ paths }) => [
  new SVGSpritemapPlugin(
    bootstrapIconsFiles(paths),
    {
      output: {
        filename: paths.icons.spriteFile,
        svgo: true, // <- turn on SVG optimizations
      },
      sprite: {
        // Sprite SVG from Bootstrap Icons has no prefix:
        prefix: () => '',
        generate: {
          title: false,
          use: true,
        },
      }
    }
  )
]

module.exports = { iconsSpritePlugins }
