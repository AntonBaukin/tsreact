import stylesVarsJson from './vars.json'

const stylesVars = stylesVarsJson as StylesVars

export default stylesVars

export interface StylesVars {
  font: {
    size: string,
  }
  size: {
    s: string,
    m: string,
    l: string,
    x: string,
  }
  screen: {
    phone: string,
    tablet: string,
    desktop: string,
    wide: string,
    huge: string,
  },
}

/**
 * Returns configuration of screen widths in pixels.
 */
export const screenWidths = () => {
  const {
    phone,
    tablet,
    desktop,
    wide,
    huge,
  } = stylesVars.screen

  const px = (s: string): number | null => {
    const m = s.match(/(\d+)px/)
    const n = Number(m?.[1])
    return Number.isInteger(n) ? n : null
  }

  return {
    phone: px(phone),
    tablet: px(tablet),
    desktop: px(desktop),
    wide: px(wide),
    huge: px(huge),
  }
}
