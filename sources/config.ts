import config from '../config.json'

export interface Config {
  publicPath: string;
  webNodeName: string;
  pageTitle: string;
  defaultLang: string;
  globalLangVariable: string;
  iconsSpriteFile: string;
  endpoints: Record<string, string>;
}

export const IS_DEV = (() => {
  try {
    return 'development' === process.env.NODE_ENV
  } catch {
    return false
  }
})()

export default config as Config
