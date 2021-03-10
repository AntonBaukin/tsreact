import AppBase from 'src/components/AppBase'
import appContext from './context'
import routes from './routes'
import './styles.scss'

const MainApp = () => (
	<AppBase
		appContext={appContext}
		routes={routes}
	/>
)

export default MainApp
