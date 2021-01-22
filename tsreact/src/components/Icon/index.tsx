import { memo } from 'react'
import { PropTypes, propTypes, defaultProps } from './props'

/**
 * Icon from a SVG sprite file.
 */
const Icon = ({ name, size, color, className, style, spriteName } : PropTypes) => (
	<svg
		width={size}
		height={size}
		fill={color}
		className={className}
		style={style}
	>
		<use xlinkHref={`${spriteName}#${name}`} />
	</svg>
)

Icon.propTypes = propTypes
Icon.defaultProps = defaultProps

export default memo(Icon)
