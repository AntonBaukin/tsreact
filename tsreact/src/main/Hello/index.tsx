import classNames from 'classnames'
import Icon from 'src/components/Icon'
import Counter from 'src/main/Counter'
import styles from './styles.module.scss'

const Hello = () => (
	<div className={classNames('container', styles.container)}>
		<div className="card">
			<div className="card-header h5">
				<span className={classNames('card-title', styles.heading)}>
					<span className={styles.icon}>
						<Icon name="alarm" />
					</span>
					<span>Hello, World!</span>
				</span>
			</div>

			<div className="card-body">
				<div>So, Bootstrap was added...</div>
				<div>And Bootstrap Icons either! </div>
				<Counter />
			</div>
		</div>
	</div>
)

export default Hello
