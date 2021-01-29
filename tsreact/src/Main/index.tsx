import AppBase from 'src/components/AppBase'
import Hello from '../main/Hello'
import appContext from './context'
import './styles.scss'

const MainApp = () => (
	<AppBase appContext={appContext}>
		<Hello />
	</AppBase>
)

export default MainApp
