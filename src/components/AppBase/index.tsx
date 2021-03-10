import { Component, ReactNode } from 'react'
import { Router } from 'react-router-dom'
import { renderRoutes } from 'react-router-config'
import { Provider } from 'react-redux'
import AppContext from 'src/data/AppContext'
import { PropTypes, propTypes, defaultProps } from './props'

export { createAppStore } from './store'

export default abstract class AppBase extends Component<PropTypes>
{
	static propTypes = propTypes

	static defaultProps = defaultProps

	componentDidMount() {
		const { onAppInit } = this.props
		onAppInit(this.appContext)
	}

	readonly $appContext: AppContext | undefined

	get appContext(): AppContext {
		const { appContext } = this.props

		if (appContext) {
			return appContext
		}

		if (this.$appContext) {
			return this.$appContext
		}

		throw new Error('Application base has no context provided')
	}

	renderApp(): ReactNode | undefined {
		const { routes, children } = this.props

		if (routes) {
			return renderRoutes(Array.isArray(routes) ? routes : [routes])
		}

		return children
	}

	render() {
		return (
			<AppContext.React.Provider value={this.appContext}>
				<Provider store={this.appContext.store}>
					<Router history={this.appContext.history}>
						{this.renderApp()}
					</Router>
				</Provider>
			</AppContext.React.Provider>
		)
	}
}
