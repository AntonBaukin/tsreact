module.exports = ({ env, args }) => {
	const isDevEnv = env.development === true
	const isArgProd = args.mode === 'production'
	let mode = process.env.NODE_ENV

	if (!mode) {
		if (isDevEnv && !isArgProd) {
			mode = 'development'
		}

		if (!isDevEnv && isArgProd) {
			mode = 'production'
		}
	}

	if (mode !== 'development' && mode !== 'production') {
		throw new Error(
			'Pass --mode=production|development to Webpack CLI, ' +
			'or set NODE_ENV environment variable!'
		)
	}

	if (!process.env.NODE_ENV) {
		process.env.NODE_ENV = mode
	}

	return mode
}
