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
        plugins: [
          'autoprefixer',
          [
            'postcss-discard-comments',
            { removeAll: true },
          ],
        ]
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

const sassLoader = (
  paths,
  {
    additionalData,
    silenceDeprecations,
  } = {},
) => ({
  loader: 'sass-loader',
  options: {
    sourceMap: true,
    additionalData,
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
  sassLoader(paths, {
    silenceDeprecations: ['import', 'mixed-decls'],
  }),
]

const DEFAULT_MODULE_IMPORTS = `
  @use "styles/vars.json";
`

const defaultModuleImports = (content, loaderContext) => {
  const { resourcePath } = loaderContext

  if (!resourcePath.endsWith('.module.scss')) {
    return content
  }

  return DEFAULT_MODULE_IMPORTS.concat('\n', content)
}


const useModuleCss = (paths) => [
  ...baseCssLoaders(),
  sassLoader(paths, {
    additionalData: defaultModuleImports,
  }),
]

const STYLES = 'styles/'

/**
 * Suports 'styles/' and '~' (for node modules) prefixes.
 */
const tildaImporter = (paths) => {
  const { modules, styles } = paths

  const findFileUrl = (file) => {
    let targetFile = null

    if (file.startsWith(STYLES)) {
      targetFile = path.join(styles.sources, file.substring(STYLES.length))
    }

    if (file.startsWith('~')) {
      targetFile = path.join(modules, file.substring('~'.length))
    }

    return targetFile ? pathToFileURL(targetFile) : null
  }

  return { findFileUrl }
}

const jsonImporter = (paths) => {
  const { base, styles } = paths

  const canonicalize = (file, { containingUrl }) => {
    if (!/\.json$/.test(file)) {
      return null
    }

    if (containingUrl?.protocol !== 'file:') {
      return null
    }

    const { pathname: containingFile } = containingUrl
    if (!containingFile) {
      return null
    }

    const sourceFile = file.startsWith(STYLES)
      ? path.join(styles.sources, file.substring(STYLES.length))
      : path.resolve(path.dirname(containingFile), file)

    if (!sourceFile.startsWith(base)) {
      return null
    }

    return pathToFileURL(sourceFile)
  }

  const load = (url) => {
    const { pathname: file } = url
    if (url.protocol !== 'file:' || !file.startsWith(base)) {
      return null
    }

    return Promise.resolve((async () => {
      let json

      try {
        const jsonStr = await fsPromises.readFile(file, 'utf8')
        json = JSON.parse(jsonStr)
      } catch (e) {
        console.error(`Error parsing JSON file ${file}\n`, e)
        throw e
      }

      const contents = jsonToSass(json)
      return { syntax: 'scss', contents }
    })())
  }

  return { canonicalize, load }
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
  sassLines.push('')

  return sassLines.join('\n')
}

const encodeRequired = (value) => value.includes('/')

const encodeScssValue = (value) => {
  if (!encodeRequired(value)) {
    return value
  }

  const escaped = String(value)
    .replace(/[\\]/g, '\\\\')
    .replace(/["]/g, '\\"')

  return `#{"${escaped}"}`
}

module.exports = { cssPlugins, useGlobalCss, useModuleCss }
