const { PROD, DEV } = require('./utils')

module.exports = ({ env, args }) => {
  const isDevEnv = env[DEV] === true
  const isArgProd = args.mode === PROD
  let mode = process.env.NODE_ENV

  if (!mode) {
    if (isDevEnv && !isArgProd) {
      mode = DEV
    }

    if (!isDevEnv && isArgProd) {
      mode = PROD
    }
  }

  if (mode !== PROD && mode !== DEV) {
    throw new Error(
      `Pass --mode=${PROD}|${DEV} to Webpack CLI, ` +
      'or set NODE_ENV environment variable!'
    )
  }

  if (!process.env.NODE_ENV) {
    process.env.NODE_ENV = mode
  }

  return mode
}
