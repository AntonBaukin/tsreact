import classNames from 'classnames'
import Text from 'src/components/Text'
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
					<span><Text>HELLO</Text></span>
				</span>
			</div>

			<div className="card-body">
				<div><Text>SO</Text></div>
				<div><Text>AND</Text></div>
				<Counter />
			</div>
		</div>
	</div>
)

export default Hello
