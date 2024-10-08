const { pathToFileURL } = require('url')
const path = require('path')
const fsPromises = require('fs/promises')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')

const cssPlugins = ({ paths }) => [
  new MiniCssExtractPlugin({
    filename: path.join(paths.styles.output, '[name].[contenthash:8].css')
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
        localIdentName: '[name]-[local]-[hash:base64:4]',
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
        importers: [jsonImporter(paths)],
        quietDeps: true,
        includePaths: [
          paths.styles.sources,
        ],
      }
    }
  },
]

const jsonImporter = (paths) => {
  const { base, output } = paths

  const findFileUrl = (file, { containingUrl }) => {
    if (!/\.json$/.test(file)) {
      return null
    }

    if (!containingUrl || containingUrl.protocol !== 'file:') {
      return null
    }

    const { pathname: containingFile } = containingUrl
    if (!containingFile) {
      return null
    }

    const containingDir = path.dirname(containingFile)
    const sourceFile = path.resolve(containingDir, file)

    if (!sourceFile.startsWith(base)) {
      return null
    }

    const targetDir = path.dirname(
      path.join(
        output,
        'sass-json-importer',
        sourceFile.substring(base.length),
      ),
    )

    const targetFile = path.join(
      targetDir,
      path.basename(sourceFile).slice(0, -5) + '.scss',
    )

    return Promise.resolve((async () => {
      let json

      try {
        const jsonStr = await fsPromises.readFile(sourceFile, 'utf8')
        json = JSON.parse(jsonStr)
      } catch (e) {
        console.error(`Error parsing JSON file ${sourceFile}\n`, e)
        throw e
      }

      const sassLines = Object.keys(json).map(key => {
        const value = json[key] // expected string or number
        return `\$${key}: ${value};`;
      })

      await fsPromises.mkdir(path.dirname(targetFile), { recursive: true })
      await fsPromises.writeFile(targetFile, sassLines.join('\n'))

      return pathToFileURL(targetFile)
    })())
  }

  return { findFileUrl }
}

module.exports = { cssPlugins, useCss }
