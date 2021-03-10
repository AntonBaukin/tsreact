import get from 'lodash/get'
import isEmpty from 'lodash/isEmpty'
import template from 'lodash/template'
import { ReactElement, useMemo } from 'react'
import { PropTypes, propTypes, defaultProps } from './props'
import { IS_DEV_ENV } from 'src/utils/env'
import { FALLBACK_LANG, getDocumentLang } from 'src/utils/text'

export { text } from 'src/utils/text'

/**
 * Returns text taken from i18n dictionary stored
 * as global object «LANG» (in global window).
 *
 * The language code is optional, it's taken by default
 * from standard attribute «lang» of <html> tag.
 */
const Text = ({ lang, children: code, ...params }: PropTypes): JSX.Element | null => {
	const usedLang = lang || getDocumentLang() || FALLBACK_LANG
	const text: unknown = get(window, ['LANG', usedLang, code])

	if (typeof text !== 'string') {
		if (IS_DEV_ENV) {
			console.warn(`Text code [${code}] is not found!`)
		}

		return null
	}

	if (isEmpty(params)) {
		return text as unknown as JSX.Element
	}

	const compiled = useMemo(() => template(text), [text])
	return compiled(params) as unknown as JSX.Element
}

Text.propTypes = propTypes
Text.defaultProps = defaultProps

export default Text
