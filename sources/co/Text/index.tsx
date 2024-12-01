import { FC, memo } from 'react'
import { TextProps } from './types'
import { useTextValue } from './hooks'

export { useTextValue, useTextTemplate } from './hooks'
export { textTemplate, getDocumentLang } from './utils'

const Text: FC<TextProps> = ({ children, lang, ...params}) => {
  const value = useTextValue(children, params, lang)
  return value || null
}

export default memo(Text)
