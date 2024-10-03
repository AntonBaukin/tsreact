module.exports = ({ paths }) => ({
  port: 8080,
  host: '127.0.0.1',
  compress: true,
  historyApiFallback: true,
  liveReload: false,
  hot: false,
  webSocketServer: false,
  watchFiles: [
    paths.main.html,
    paths.main.entry,
    `${paths.main.sources}/**/*.js`,
    `${paths.main.sources}/**/*.scss`,
    `${paths.main.sources}/**/*.ts`,
    `${paths.main.sources}/**/*.tsx`,
    `${paths.styles.sources}/**/*.scss`,
  ],
})
