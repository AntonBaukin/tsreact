import get from 'lodash/get'
import isEmpty from 'lodash/isEmpty'
import template from 'lodash/template'
import { IS_DEV_ENV } from 'src/utils/env'

export const FALLBACK_LANG = 'en'

export const getDocumentLang = (): (string|null) => (
	window.document.documentElement.getAttribute('lang')
)

export interface TextParams {
	[key: string]: string | number | undefined
}

/**
 * Used as Text component to provide i18n text by the given code.
 * It's not so efficient as compiled template is not memoized.
 */
export function text(
	code: string,
	params?: TextParams,
	lang?: string
): string | undefined {
	const usedLang = lang || getDocumentLang() || FALLBACK_LANG
	const text: unknown = get(window, ['LANG', usedLang, code])

	if (typeof text !== 'string') {
		if (IS_DEV_ENV) {
			console.warn(`Text code [${code}] is not found!`)
		}

		return undefined
	}

	if (isEmpty(params)) {
		return text
	}

	return template(text)(params)
}
