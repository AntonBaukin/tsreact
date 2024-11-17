const assert = require('node:assert')
const fs = require('fs')
const path = require('path')
const SVGSpritemapPlugin = require('svg-spritemap-webpack-plugin')

const bootstrapIconsFiles = (paths) => {
  const scriptContent = fs.readFileSync(
    paths.icons.bootstrapTs,
    { encoding: 'utf8', flag: 'r' },
  )

  assert(scriptContent.includes('export default ['))
  const namesMatch = scriptContent.match(/export default \[([^\]]+)\]/)

  assert(namesMatch[1])
  const names = namesMatch[1].split(/[\s,']+/).filter(s => s.length)
  assert(names.length)

  return names.map(icon => path.join(paths.icons.bootstrap, `${icon}.svg`))
}

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
