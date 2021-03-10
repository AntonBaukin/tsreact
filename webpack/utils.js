const PROD = 'production'
const DEV = 'development'

const isprod = (mode) => mode === PROD
const isdev = (mode) => mode === DEV

module.exports = {
	PROD,
	DEV,
	isprod,
	isdev,
}
