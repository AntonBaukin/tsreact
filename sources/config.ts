import config from '../config.json'

export interface Config {
  publicPath: string;
  reactRootId: string;
  pageTitle: string;
  defaultLang: string;
  globalLangVariable: string;
  endpoints: Record<string, string>;
}

export default config as Config
