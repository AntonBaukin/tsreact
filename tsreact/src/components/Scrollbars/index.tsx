import classNames from 'classnames'
import { PropTypes, propTypes, defaultProps } from './props'
import styles from './styles.module.scss'

/**
 * Simple native scrollbars with vertical scrolling.
 * TODO: extend Scrollbars with support for horizontal scrolling, etc?
 */
const Scollbars = ({ children, className }: PropTypes) => (
	<div className={classNames(styles.scrollbars, className)}>
		{children}
	</div>
)

Scollbars.propTypes = propTypes
Scollbars.defaultProps = defaultProps

export default Scollbars
