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
    desktop: string,
  },
}

/**
 * Returns configuration of screen widths in pixels.
 */
export const screenWidths = () => {
  const { phone, desktop } = stylesVars.screen

  const px = (s: string): number | null => {
    const m = s.match(/(\d+)px/)
    const n = Number(m?.[1])
    return Number.isInteger(n) ? n : null
  }

  return {
    phone: px(phone),
    desktop: px(desktop),
  }
}
