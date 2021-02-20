import { IS_DEV_ENV } from './env'

/**
 * The last resort when handling asynchronous errors.
 */
export const handleAsyncError = (error: Error) => {
	if (IS_DEV_ENV) {
		console.error(error)
	}
}
