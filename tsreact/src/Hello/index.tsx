import classNames from 'classnames'
import styles from './styles.module.scss'

const Hello = () => (
	<div className={classNames('container', styles.container)}>
		<div className="card">
			<div className="card-header">
				<span className={classNames('card-title', styles.heading)}>
					Hello, World!
				</span>
			</div>
			<div className="card-body">
				So, Bootstrap was added...
			</div>
		</div>
	</div>
)

export default Hello
