import { Provider } from 'react-redux'
import AppContext from 'src/data/AppContext'
import Hello from '../main/Hello'
import appContext from './context'
import './styles.scss'

const Main = () => (
	<AppContext.React.Provider value={appContext}>
		<Provider store={appContext.store}>
			<Hello />
		</Provider>
	</AppContext.React.Provider>
)

export default Main
