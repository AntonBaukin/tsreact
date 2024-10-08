const useFontsAsset = (paths) => ({
  type: 'asset/resource',
  generator: {
    filename: `${paths.fonts.output}/[hash][ext]`
  }
})

module.exports = { useFontsAsset }
