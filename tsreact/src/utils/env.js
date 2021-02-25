import get from 'lodash/get'
import config from 'src/../config.json'

export const CONFIG = config

export const ENDPOINTS = get(CONFIG, 'endpoints', {})

export const REDUX_DEVTOOLS_OPTS = get(CONFIG, 'dev.redux', {})

export const IS_DEV_ENV = [
	'development',
	JSON.stringify('development'),
].includes(process.env.NODE_ENV)

export const NPI_PAGE_SIZE = get(CONFIG, 'data.npi.pageSize', 10)
