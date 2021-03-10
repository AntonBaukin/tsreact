import { IS_DEV_ENV } from './env'

export function logInfo(...msg: any[]): void {
	if (IS_DEV_ENV) {
		console.log(...msg)
	}
}

export function logWarn(...msg: any[]): void {
	if (IS_DEV_ENV) {
		console.warn(...msg)
	}
}

export function logError(...msg: any[]): void {
	if (IS_DEV_ENV) {
		console.error(...msg)
	}
}

export function logAsyncError(...msg: any[]): void {
	if (IS_DEV_ENV) {
		console.error(...msg)
	}
}

export function logRestGet(url: URL): void {
	if (IS_DEV_ENV) {
		console.log(`GET ${url.toString()}`)
	}
}
