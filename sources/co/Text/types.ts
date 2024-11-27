
export type TextParam = string | number | boolean | null | undefined

export type TextParams = Record<string, TextParam>

export type Interpolator = (params: TextParams) => string

export type TextTemplate = Interpolator | string

export interface TextProps extends TextParams {
  // Optional language, default if frond from the document:
  lang?: string,
  // Code value of the translated text:
  children: string,
}
