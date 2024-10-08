const PROD = 'production'
const DEV = 'development'

const isPROD = (mode) => mode === PROD
const isDEV = (mode) => mode === DEV

module.exports = {
  PROD,
  DEV,
  isPROD,
  isDEV,
}
