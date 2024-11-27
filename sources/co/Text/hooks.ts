import { useMemo } from 'react'
import { isString } from 'sources/lodash'
import { TextParams, TextTemplate } from './types'
import { textTemplate } from './utils'

export const useTextTemplate = (code: string, lang?: string): TextTemplate | null =>
  useMemo(() => textTemplate(code, lang), [code, lang])

export const useTextValue = (code: string, params?: TextParams, lang?: string) => {
  const template = useTextTemplate(code, lang)

  if (!template) {
    return ''
  }

  if (isString(template)) {
    return template
  }

  return template(params ?? {})
}
