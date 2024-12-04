const useFontsAsset = (paths) => ({
  type: 'asset',
  generator: {
    filename: `${paths.fonts.output}/[hash][ext]`
  },
  parser: {
    dataUrlCondition: (_source, { module }) => {
      const { resourceResolveData: { query } } = module
      return query === '?inline'
    },
  },
})

module.exports = { useFontsAsset }
