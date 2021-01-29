import { Component, ReactNode } from 'react'
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
		if (this.props.appContext) {
			return this.props.appContext
		}

		if (this.$appContext) {
			return this.$appContext
		}

		throw new Error('Application base has no context provided')
	}

	renderApp(): ReactNode | undefined {
		return this.props.children
	}

	render() {
		return (
			<AppContext.React.Provider value={this.appContext}>
				<Provider store={this.appContext.store}>
					{this.renderApp()}
				</Provider>
			</AppContext.React.Provider>
		)
	}
}
