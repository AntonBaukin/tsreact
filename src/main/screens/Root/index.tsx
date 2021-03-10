import { renderRoutes } from 'react-router-config'
import classNames from 'classnames'
import Text from 'src/components/Text'
import { PropTypes, propTypes, defaultProps } from './props'
import styles from './styles.module.scss'

const Root = ({ route }: PropTypes ) => (
	<>
		<div className={styles.mainRoot}>
			<div className={classNames('h4', styles.title)}>
				<Text>ROOT_TITLE</Text>
			</div>
		</div>
		{renderRoutes(route.routes)}
	</>
)

Root.propTypes = propTypes
Root.defaultProps = defaultProps

export default Root
