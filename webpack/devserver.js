const express = require('express')
const { readDbUsers, PersonsView } = require('../sample/db_users.mjs')
const { default: dbUsersRouter } = require('../sample/db_users.router.mjs')

module.exports = async ({ paths }) => {
  const dbUsers = await readDbUsers()
  const personsView = new PersonsView(dbUsers)

  const usersApi = express.Router()
  dbUsersRouter(usersApi, personsView)

  const setupMiddlewares = (middlewares, devServer) => {
    devServer.app.use(express.json())
    devServer.app.use('/api/users', usersApi)
    return middlewares
  }

  return ({
    port: 8080,
    host: '0.0.0.0', // '127.0.0.1',
    compress: true,
    historyApiFallback: true,
    liveReload: false,
    hot: false,
    webSocketServer: false,
    setupMiddlewares,
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
}




