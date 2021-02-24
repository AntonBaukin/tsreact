import get from 'lodash/get'
import config from 'src/../config.json'

export const CONFIG = config

export const DEVTOOLS_REDUX = get(CONFIG, 'dev.redux', {})

export const ENDPOINTS = get(CONFIG, 'endpoints', {})

export const IS_DEV_ENV = [
	'development',
	JSON.stringify('development'),
].includes(process.env.NODE_ENV)
