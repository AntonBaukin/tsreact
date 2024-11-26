const { pathToFileURL } = require('url')
const path = require('path')
const fsPromises = require('fs/promises')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')

const cssPlugins = ({ paths }) => [
  new MiniCssExtractPlugin({
    filename: path.join(paths.styles.output, '[name].[contenthash:8].css')
  })
]

const baseCssLoaders = () => [
  {
    loader: MiniCssExtractPlugin.loader
  },
  {
    loader: 'css-loader',
    options: {
      sourceMap: true,
      importLoaders: 1,
      modules: {
        namedExport: false,
        exportLocalsConvention: 'as-is',
        localIdentName: '[local]-[hash:base64:8]',
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
]

const sassLoader = (paths, silenceDeprecations) => ({
  loader: 'sass-loader',
  options: {
    sourceMap: true,
    // additionalData: defaultScssImports, — @see Git history
    sassOptions: {
      importers: [
        tildaImporter(paths),
        jsonImporter(paths),
      ],
      includePaths: [
        paths.styles.sources,
      ],
      silenceDeprecations,
    },
  }
})


const useGlobalCss = (paths) => [
  ...baseCssLoaders(),
  sassLoader(paths, [ 'import' ]),
]

const useModuleCss = (paths) => [
  ...baseCssLoaders(),
  sassLoader(paths),
]

/**
 * Suports 'styles/' and '~' (for node modules) prefixes.
 */
const tildaImporter = (paths) => {
  const { modules, styles } = paths

  const findFileUrl = (file) => {
    let targetFile = null

    if (file.startsWith('styles/')) {
      targetFile = path.join(styles.sources, file.substring('styles/'.length))
    }

    if (file.startsWith('~')) {
      targetFile = path.join(modules, file.substring('~'.length))
    }

    return targetFile ? pathToFileURL(targetFile) : null
  }

  return { findFileUrl }
}

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

      const sass = jsonToSass(json)

      await fsPromises.mkdir(path.dirname(targetFile), { recursive: true })
      await fsPromises.writeFile(targetFile, sass)

      return pathToFileURL(targetFile)
    })())
  }

  return { findFileUrl }
}

const jsonToSass = (json) => {
  const sassLines = []

  function addKeys(prefix, obj) {
    Object.keys(obj).forEach(key => {
      const value = obj[key]

      if (typeof value === 'object') {
        addKeys(`${prefix}${key}-`, value)
      } else {
        sassLines.push(`\$${prefix}${key}: ${encodeScssValue(value)};`)
      }
    })
  }

  addKeys('', json)
  return sassLines.join('\n')
}

const encodeScssValue = (value) => {
  const escaped = String(value)
    .replace(/[\\]/g, '\\\\')
    .replace(/["]/g, '\\"')

  return `#{"${escaped}"}`
}

module.exports = { cssPlugins, useGlobalCss, useModuleCss }
