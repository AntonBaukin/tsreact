import stylesVarsJson from './vars.json'

const stylesVars = stylesVarsJson as StylesVars

export default stylesVars

export interface StylesVars {
  font: {
    base: {
      family: string,
      size: string,
      weight: {
        light: number,
        normal: number,
      },
    },
    headings: {
      family: string,
    },
  },
  screen: {
    width: {
      phone: string,
      tablet: string,
      desktop: string,
      wide: string,
      huge: string,
    },
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
  } = stylesVars.screen.width

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
