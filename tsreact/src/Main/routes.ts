import { RouteConfig } from 'react-router-config'
import Root from 'src/main/screens/Root'
import Search from 'src/main/screens/Search'

export default {
	path: '/',
	component: Root,
	routes: [
		{
			path: '/',
			exact: true,
			component: Search,
		},
	]
} as RouteConfig
