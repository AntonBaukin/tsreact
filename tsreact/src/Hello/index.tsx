import fonts from 'styles/fonts.json'
import styles from './styles.module.scss'

const style = {
	fontSize: fonts.fontSizeBase
}

const Hello = () => (
	<div
		className={styles.heading}
		style={style}
	>
		Hello, World!
	</div>
)

export default Hello
