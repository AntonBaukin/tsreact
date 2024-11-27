import { getReactDomNode } from 'sources/co/Root/utils'
import { isObject, isString, get, template } from 'sources/lodash'
import config from 'sources/config'
import { TextParams, TextTemplate } from './types'

export const getDocumentLang = () => {
  const appNode = getReactDomNode()
  const appLang = appNode?.getAttribute('lang')
  if (appLang?.length === 2) {
    return appLang.toLowerCase()
  }

  const docLang = document.documentElement.getAttribute('lang')
  if (docLang?.length === 2) {
    return docLang.toLowerCase()
  }

  return config.defaultLang
}

export const textTemplate = (code: string, lang?: string): TextTemplate | null => {
  const usedLang = lang ?? getDocumentLang()
  if (!usedLang?.length) {
    return null
  }

  const langDict: unknown = get(window, [config.globalLangVariable, usedLang])
  if (!isObject(langDict)) {
    return null
  }

  const text: unknown = get(langDict, code)
  if (!isString(text)) {
    return null
  }

  // {Not a Lodash template code?}
  if (!text.includes('<%') && !text.includes('\${')) {
    return text
  }

  let compiled: ReturnType<typeof template> | null = null

  try {
    compiled = template(text)
  } catch {
    return null
  }

  return (params: TextParams) => {
    try {
      return compiled(params)
    } catch {
      return ''
    }
  }
}
